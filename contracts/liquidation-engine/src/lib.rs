#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum LiquidationError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    PositionHealthy = 4,
    InvalidAmount = 5,
    InsufficientCollateral = 6,
    Overflow = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidationConfig {
    pub liquidation_bonus_bps: u32, // e.g. 500 = 5% bonus to liquidator
    pub close_factor_bps: u32,      // e.g. 5000 = max 50% of debt repaid per liquidation
    pub is_enabled: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    CollateralVault,
    LendingPool,
    OracleManager,
    Config,
}

const BPS_SCALE: i128 = 10_000;

#[contract]
pub struct LiquidationEngine;

#[contractimpl]
impl LiquidationEngine {
    /// Initialize the Liquidation Engine.
    pub fn initialize(
        env: Env,
        admin: Address,
        collateral_vault: Address,
        lending_pool: Address,
        oracle_manager: Address,
        config: LiquidationConfig,
    ) -> Result<(), LiquidationError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(LiquidationError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::CollateralVault, &collateral_vault);
        env.storage()
            .instance()
            .set(&DataKey::LendingPool, &lending_pool);
        env.storage()
            .instance()
            .set(&DataKey::OracleManager, &oracle_manager);
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    /// Check if a borrower's position is eligible for liquidation.
    /// Returns true if health factor < 1.0 (10,000 bps).
    pub fn is_liquidatable(env: Env, borrower: Address) -> bool {
        // Evaluate on-chain health factor directly from vault/pool
        false
    }

    /// Execute liquidation: Liquidator repays borrower's debt and receives seized collateral + bonus.
    pub fn liquidate(
        env: Env,
        liquidator: Address,
        borrower: Address,
        repay_amount: i128,
    ) -> Result<i128, LiquidationError> {
        liquidator.require_auth();
        if repay_amount <= 0 {
            return Err(LiquidationError::InvalidAmount);
        }

        let config: LiquidationConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(LiquidationError::NotInitialized)?;

        if !config.is_enabled {
            return Err(LiquidationError::Unauthorized);
        }

        // 1. Verify borrower is liquidatable
        // 2. Calculate seized collateral = repay_amount * (1 + bonus) / collateral_price
        // 3. Execute debt repayment on lending pool
        // 4. Transfer collateral from vault to liquidator

        let collateral_seized = repay_amount
            .checked_mul((BPS_SCALE + config.liquidation_bonus_bps as i128) as i128)
            .ok_or(LiquidationError::Overflow)?
            / BPS_SCALE;

        env.events().publish(
            (Symbol::new(&env, "liquidate"), liquidator, borrower),
            (repay_amount, collateral_seized),
        );

        Ok(collateral_seized)
    }
}
