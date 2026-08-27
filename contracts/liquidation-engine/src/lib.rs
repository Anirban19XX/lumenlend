#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol};

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
    pub asset: Address,             // single-asset market: collateral == borrow asset
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

// Mirror of lending-pool's UserLendingPosition — same field layout, independent type.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserLendingPositionMirror {
    pub supplied_shares: i128,
    pub principal_borrowed: i128,
    pub borrow_index: i128,
    pub last_updated: u64,
}

#[soroban_sdk::contractclient(name = "CollateralVaultPeerClient")]
pub trait CollateralVaultPeer {
    fn get_health_factor(env: Env, user: Address) -> i128;
    fn seize_collateral(env: Env, borrower: Address, liquidator: Address, amount: i128);
}

#[soroban_sdk::contractclient(name = "LendingPoolPeerClient")]
pub trait LendingPoolPeer {
    fn get_user_position(env: Env, user: Address, asset: Address) -> UserLendingPositionMirror;
    fn liquidation_repay(env: Env, payer: Address, borrower: Address, asset: Address, amount: i128) -> i128;
}

const BPS_SCALE: i128 = 10_000;
const HEALTHY_THRESHOLD_BPS: i128 = 10_000;

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

    /// Check if a borrower's position is eligible for liquidation (health factor < 1.0).
    pub fn is_liquidatable(env: Env, borrower: Address) -> bool {
        let vault_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::CollateralVault)
            .expect("not initialized");
        let vault_client = CollateralVaultPeerClient::new(&env, &vault_addr);
        vault_client.get_health_factor(&borrower) < HEALTHY_THRESHOLD_BPS
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

        if !Self::is_liquidatable(env.clone(), borrower.clone()) {
            return Err(LiquidationError::PositionHealthy);
        }

        let pool_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::LendingPool)
            .ok_or(LiquidationError::NotInitialized)?;
        let pool_client = LendingPoolPeerClient::new(&env, &pool_addr);
        let position = pool_client.get_user_position(&borrower, &config.asset);

        let max_repayable = position
            .principal_borrowed
            .checked_mul(config.close_factor_bps as i128)
            .ok_or(LiquidationError::Overflow)?
            / BPS_SCALE;
        let repay_actual = if repay_amount > max_repayable {
            max_repayable
        } else {
            repay_amount
        };

        pool_client.liquidation_repay(&liquidator, &borrower, &config.asset, &repay_actual);

        // Single-asset market: collateral and borrow asset share the same price,
        // so seized collateral is simply the repaid amount plus the liquidator bonus.
        let collateral_seized = repay_actual
            .checked_mul(BPS_SCALE + config.liquidation_bonus_bps as i128)
            .ok_or(LiquidationError::Overflow)?
            / BPS_SCALE;

        let vault_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::CollateralVault)
            .ok_or(LiquidationError::NotInitialized)?;
        let vault_client = CollateralVaultPeerClient::new(&env, &vault_addr);
        vault_client.seize_collateral(&borrower, &liquidator, &collateral_seized);

        env.events().publish(
            (Symbol::new(&env, "liquidate"), liquidator, borrower),
            (repay_actual, collateral_seized),
        );

        Ok(collateral_seized)
    }
}
