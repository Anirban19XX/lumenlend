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
    LiquidationEngine,
    Config,
    CollateralBalance(Address), // User -> Amount
}

// Mirror of lending-pool's UserLendingPosition — same field layout, independent type
// (Soroban contracts interop over XDR shape, not shared Rust types).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserLendingPositionMirror {
    pub supplied_shares: i128,
    pub principal_borrowed: i128,
    pub borrow_index: i128,
    pub last_updated: u64,
}

#[soroban_sdk::contractclient(name = "LendingPoolPeerClient")]
pub trait LendingPoolPeer {
    fn get_user_position(env: Env, user: Address, asset: Address) -> UserLendingPositionMirror;
}

#[soroban_sdk::contractclient(name = "OracleManagerPeerClient")]
pub trait OracleManagerPeer {
    fn get_price(env: Env, asset: Address) -> i128;
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
        liquidation_engine: Address,
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
        env.storage()
            .instance()
            .set(&DataKey::LiquidationEngine, &liquidation_engine);
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    /// Admin-only risk parameter update. In a single-asset market, collateral and debt
    /// share the same price, so it cancels out of the health-factor calculation — a price
    /// move alone can never make a position liquidatable. Adjusting the liquidation
    /// threshold (a real governance lever) is what actually moves health factors here.
    pub fn set_liquidation_threshold(
        env: Env,
        admin: Address,
        new_bps: u32,
    ) -> Result<(), VaultError> {
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(VaultError::NotInitialized)?;
        if admin != stored_admin {
            return Err(VaultError::Unauthorized);
        }
        admin.require_auth();

        let mut config: CollateralConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(VaultError::NotInitialized)?;
        config.liquidation_threshold_bps = new_bps;
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    /// Deposit collateral asset into vault.
    pub fn deposit_collateral(env: Env, user: Address, amount: i128) -> Result<i128, VaultError> {
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
    pub fn withdraw_collateral(env: Env, user: Address, amount: i128) -> Result<i128, VaultError> {
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

        // Check if health factor remains >= 1.0 (10,000 bps) after withdrawal
        let is_safe = Self::check_safety_internal(&env, &config, &user, new_balance)?;
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

    /// Get health factor in basis points (10,000 = 1.0 = 100%). i128::MAX when no debt.
    /// Health Factor = (Collateral Value * Liquidation Threshold) / Debt Value
    pub fn get_health_factor(env: Env, user: Address) -> i128 {
        Self::get_health_factor_internal(&env, &user).unwrap()
    }

    fn get_health_factor_internal(env: &Env, user: &Address) -> Result<i128, VaultError> {
        let config: CollateralConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(VaultError::NotInitialized)?;

        let debt_units = Self::current_debt(env, &config, user)?;
        if debt_units == 0 {
            return Ok(i128::MAX);
        }

        let collateral_value = Self::collateral_value_usd(env, &config, user)?;
        let debt_value = Self::asset_value_usd(env, &config.borrow_asset, debt_units)?;

        let adjusted_collateral = collateral_value
            .checked_mul(config.liquidation_threshold_bps as i128)
            .ok_or(VaultError::Overflow)?
            / BPS_SCALE;

        let health_factor = adjusted_collateral
            .checked_mul(BPS_SCALE)
            .ok_or(VaultError::Overflow)?
            / debt_value;

        Ok(health_factor)
    }

    /// Check whether `user` can take on `additional_borrow_amount` more debt (in borrow-asset
    /// units) without exceeding max LTV. `current_debt` is supplied by lending-pool (which
    /// already holds it) rather than fetched here — lending-pool is the one calling this
    /// method, and Soroban disallows a contract re-entering itself via a cross-call cycle.
    pub fn can_borrow(
        env: Env,
        user: Address,
        current_debt: i128,
        additional_borrow_amount: i128,
    ) -> bool {
        Self::can_borrow_internal(&env, &user, current_debt, additional_borrow_amount).unwrap()
    }

    fn can_borrow_internal(
        env: &Env,
        user: &Address,
        current_debt: i128,
        additional_borrow_amount: i128,
    ) -> Result<bool, VaultError> {
        let config: CollateralConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(VaultError::NotInitialized)?;

        let collateral_value = Self::collateral_value_usd(env, &config, user)?;
        let borrow_capacity_value = collateral_value
            .checked_mul(config.max_ltv_bps as i128)
            .ok_or(VaultError::Overflow)?
            / BPS_SCALE;

        let prospective_debt_units = current_debt
            .checked_add(additional_borrow_amount)
            .ok_or(VaultError::Overflow)?;
        let prospective_debt_value =
            Self::asset_value_usd(env, &config.borrow_asset, prospective_debt_units)?;

        Ok(prospective_debt_value <= borrow_capacity_value)
    }

    /// Seize `amount` of a borrower's collateral and send it to the liquidator.
    /// Only callable by the liquidation-engine contract (auth satisfied automatically
    /// when it is the direct caller — no external signature required).
    pub fn seize_collateral(env: Env, borrower: Address, liquidator: Address, amount: i128) {
        Self::seize_collateral_internal(&env, &borrower, &liquidator, amount).unwrap()
    }

    fn seize_collateral_internal(
        env: &Env,
        borrower: &Address,
        liquidator: &Address,
        amount: i128,
    ) -> Result<(), VaultError> {
        let liquidation_engine: Address = env
            .storage()
            .instance()
            .get(&DataKey::LiquidationEngine)
            .ok_or(VaultError::NotInitialized)?;
        liquidation_engine.require_auth();

        if amount <= 0 {
            return Err(VaultError::InvalidAmount);
        }

        let config: CollateralConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(VaultError::NotInitialized)?;

        let user_key = DataKey::CollateralBalance(borrower.clone());
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
        env.storage().persistent().set(&user_key, &new_balance);

        let token_client = token::Client::new(env, &config.collateral_asset);
        token_client.transfer(&env.current_contract_address(), liquidator, &amount);

        env.events().publish(
            (
                Symbol::new(env, "seize_collat"),
                borrower.clone(),
                liquidator.clone(),
            ),
            (amount, new_balance),
        );

        Ok(())
    }

    // Helper: current collateral value in USD (scaled by 1e9), via real oracle price.
    fn collateral_value_usd(
        env: &Env,
        config: &CollateralConfig,
        user: &Address,
    ) -> Result<i128, VaultError> {
        let collateral = Self::get_collateral(env.clone(), user.clone());
        Self::asset_value_usd(env, &config.collateral_asset, collateral)
    }

    // Helper: USD value (scaled by 1e9) of `amount` units of `asset`, via real oracle price.
    fn asset_value_usd(env: &Env, asset: &Address, amount: i128) -> Result<i128, VaultError> {
        if amount == 0 {
            return Ok(0);
        }

        let oracle_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::OracleManager)
            .ok_or(VaultError::NotInitialized)?;
        let oracle_client = OracleManagerPeerClient::new(env, &oracle_addr);
        let price = oracle_client.get_price(asset);
        if price <= 0 {
            return Err(VaultError::OraclePriceInvalid);
        }

        amount
            .checked_mul(price)
            .ok_or(VaultError::Overflow)
            .map(|v| v / PRICE_SCALE)
    }

    // Helper: current outstanding debt for `user`, read from lending-pool.
    fn current_debt(
        env: &Env,
        config: &CollateralConfig,
        user: &Address,
    ) -> Result<i128, VaultError> {
        let pool_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::LendingPool)
            .ok_or(VaultError::NotInitialized)?;
        let pool_client = LendingPoolPeerClient::new(env, &pool_addr);
        let position = pool_client.get_user_position(user, &config.borrow_asset);
        Ok(position.principal_borrowed)
    }

    fn check_safety_internal(
        env: &Env,
        config: &CollateralConfig,
        user: &Address,
        _new_collateral: i128,
    ) -> Result<bool, VaultError> {
        // Evaluates the health factor using the prospective post-withdrawal balance
        // (`_new_collateral`), not the currently stored balance.
        let debt_units = Self::current_debt(env, config, user)?;
        if debt_units == 0 {
            return Ok(true);
        }

        let collateral_value =
            Self::asset_value_usd(env, &config.collateral_asset, _new_collateral)?;
        let debt_value = Self::asset_value_usd(env, &config.borrow_asset, debt_units)?;

        let adjusted_collateral = collateral_value
            .checked_mul(config.liquidation_threshold_bps as i128)
            .ok_or(VaultError::Overflow)?
            / BPS_SCALE;

        let health_factor = adjusted_collateral
            .checked_mul(BPS_SCALE)
            .ok_or(VaultError::Overflow)?
            / debt_value;

        Ok(health_factor >= BPS_SCALE)
    }
}
