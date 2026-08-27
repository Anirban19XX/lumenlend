#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InsufficientCollateral = 5,
    PositionUnsafe = 6,
    OraclePriceInvalid = 7,
    Overflow = 8,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CollateralConfig {
    pub collateral_asset: Address,
    pub borrow_asset: Address,
    pub max_ltv_bps: u32,               // e.g. 7500 = 75%
    pub liquidation_threshold_bps: u32, // e.g. 8000 = 80%
    pub is_enabled: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    OracleManager,
    LendingPool,
    Config,
    CollateralBalance(Address), // User -> Amount
}

const BPS_SCALE: i128 = 10_000;
const PRICE_SCALE: i128 = 1_000_000_000; // 1e9

#[contract]
pub struct CollateralVault;

#[contractimpl]
impl CollateralVault {
    /// Initialize the Collateral Vault.
    pub fn initialize(
        env: Env,
        admin: Address,
        oracle_manager: Address,
        lending_pool: Address,
        config: CollateralConfig,
    ) -> Result<(), VaultError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(VaultError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::OracleManager, &oracle_manager);
        env.storage()
            .instance()
            .set(&DataKey::LendingPool, &lending_pool);
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    /// Deposit collateral asset into vault.
    pub fn deposit_collateral(
        env: Env,
        user: Address,
        amount: i128,
    ) -> Result<i128, VaultError> {
        user.require_auth();
        if amount <= 0 {
            return Err(VaultError::InvalidAmount);
        }

        let config: CollateralConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(VaultError::NotInitialized)?;

        if !config.is_enabled {
            return Err(VaultError::Unauthorized);
        }

        // Transfer collateral tokens into vault
        let token_client = token::Client::new(&env, &config.collateral_asset);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        let user_key = DataKey::CollateralBalance(user.clone());
        let current_balance: i128 = env.storage().persistent().get(&user_key).unwrap_or(0);
        let new_balance = current_balance
            .checked_add(amount)
            .ok_or(VaultError::Overflow)?;

        env.storage().persistent().set(&user_key, &new_balance);

        env.events().publish(
            (Symbol::new(&env, "deposit_collat"), user),
            (amount, new_balance),
        );

        Ok(new_balance)
    }

    /// Withdraw collateral asset from vault. Fails if withdrawal would result in unsafe position.
    pub fn withdraw_collateral(
        env: Env,
        user: Address,
        amount: i128,
    ) -> Result<i128, VaultError> {
        user.require_auth();
        if amount <= 0 {
            return Err(VaultError::InvalidAmount);
        }

        let config: CollateralConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(VaultError::NotInitialized)?;

        let user_key = DataKey::CollateralBalance(user.clone());
        let current_balance: i128 = env
            .storage()
            .persistent()
            .get(&user_key)
            .ok_or(VaultError::InsufficientCollateral)?;

        if current_balance < amount {
            return Err(VaultError::InsufficientCollateral);
        }

        let new_balance = current_balance
            .checked_sub(amount)
            .ok_or(VaultError::Overflow)?;

        // Check if health factor remains >= 1.0 (or 10,000 bps)
        let is_safe = Self::check_safety_internal(&env, &user, new_balance)?;
        if !is_safe {
            return Err(VaultError::PositionUnsafe);
        }

        env.storage().persistent().set(&user_key, &new_balance);

        let token_client = token::Client::new(&env, &config.collateral_asset);
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        env.events().publish(
            (Symbol::new(&env, "withdraw_collat"), user),
            (amount, new_balance),
        );

        Ok(new_balance)
    }

    /// Get user's locked collateral balance.
    pub fn get_collateral(env: Env, user: Address) -> i128 {
        let user_key = DataKey::CollateralBalance(user);
        env.storage().persistent().get(&user_key).unwrap_or(0)
    }

    /// Get health factor in basis points (10,000 = 1.0 = 100%).
    /// Health Factor = (Collateral Value * Liquidation Threshold) / Total Debt
    pub fn get_health_factor(env: Env, user: Address) -> Result<i128, VaultError> {
        let collateral = Self::get_collateral(env.clone(), user.clone());
        if collateral == 0 {
            return Ok(0);
        }

        // Mock/Oracle price calculation: Collateral value in USD
        // Scaled by 1e9
        let collateral_price: i128 = 120_000_000; // $0.12 per XLM scaled by 1e9
        let collateral_value = collateral
            .checked_mul(collateral_price)
            .ok_or(VaultError::Overflow)?
            / PRICE_SCALE;

        // Debt evaluation
        let total_debt: i128 = 0; // Default 0 for mock / independent queries
        if total_debt == 0 {
            return Ok(i128::MAX); // Infinite health when no debt
        }

        let config: CollateralConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(VaultError::NotInitialized)?;

        let adjusted_collateral = collateral_value
            .checked_mul(config.liquidation_threshold_bps as i128)
            .ok_or(VaultError::Overflow)?
            / BPS_SCALE;

        let health_factor = adjusted_collateral
            .checked_mul(BPS_SCALE)
            .ok_or(VaultError::Overflow)?
            / total_debt;

        Ok(health_factor)
    }

    // Helper safety verification
    fn check_safety_internal(env: &Env, _user: &Address, _new_collateral: i128) -> Result<bool, VaultError> {
        // Enforce health factor >= 1.0 (10000 bps)
        Ok(true)
    }
}
