#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InsufficientLiquidity = 5,
    InsufficientCollateral = 6,
    MarketPaused = 7,
    MarketNotFound = 8,
    Overflow = 9,
    TransferFailed = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MarketState {
    pub asset: Address,
    pub total_supplied: i128,
    pub total_borrowed: i128,
    pub total_reserves: i128,
    pub borrow_index: i128, // Scaled by 1e9 (1,000,000,000)
    pub last_accrual_time: u64,
    pub reserve_factor_bps: u32, // 1000 = 10%
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserLendingPosition {
    pub supplied_shares: i128,
    pub principal_borrowed: i128,
    pub borrow_index: i128,
    pub last_updated: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    CollateralVault,
    RateModel,
    Market(Address),
    UserPosition(Address, Address), // (User, Asset)
}

#[soroban_sdk::contractclient(name = "CollateralVaultPeerClient")]
pub trait CollateralVaultPeer {
    fn can_borrow(
        env: Env,
        user: Address,
        current_debt: i128,
        additional_borrow_amount: i128,
    ) -> bool;
}

#[soroban_sdk::contractclient(name = "RateModelPeerClient")]
pub trait RateModelPeer {
    fn get_borrow_rate(env: Env, total_borrowed: i128, total_supplied: i128) -> i128;
}

const SCALE: i128 = 1_000_000_000; // 1e9 fixed-point precision
const BPS_SCALE: i128 = 10_000;
const SECONDS_PER_YEAR: i128 = 31_536_000;

#[contract]
pub struct LendingPool;

#[contractimpl]
impl LendingPool {
    /// Initialize the Lending Pool with administrator and related contract addresses.
    pub fn initialize(
        env: Env,
        admin: Address,
        collateral_vault: Address,
        rate_model: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::CollateralVault, &collateral_vault);
        env.storage()
            .instance()
            .set(&DataKey::RateModel, &rate_model);

        Ok(())
    }

    /// Register a new asset market in the lending pool.
    pub fn init_market(env: Env, asset: Address, reserve_factor_bps: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let market_key = DataKey::Market(asset.clone());
        if env.storage().persistent().has(&market_key) {
            return Err(Error::AlreadyInitialized);
        }

        let state = MarketState {
            asset: asset.clone(),
            total_supplied: 0,
            total_borrowed: 0,
            total_reserves: 0,
            borrow_index: SCALE,
            last_accrual_time: env.ledger().timestamp(),
            reserve_factor_bps,
            is_active: true,
        };

        env.storage().persistent().set(&market_key, &state);
        Ok(())
    }

    /// Supply liquidity into the pool.
    pub fn supply(env: Env, user: Address, asset: Address, amount: i128) -> Result<i128, Error> {
        user.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut state = Self::get_market_state_internal(&env, &asset)?;
        if !state.is_active {
            return Err(Error::MarketPaused);
        }

        // Accrue interest prior to balance mutations
        Self::accrue_interest_internal(&env, &mut state)?;

        // Transfer tokens from user to lending pool contract
        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // Update user lending position
        let user_key = DataKey::UserPosition(user.clone(), asset.clone());
        let mut user_pos: UserLendingPosition = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or(UserLendingPosition {
                supplied_shares: 0,
                principal_borrowed: 0,
                borrow_index: state.borrow_index,
                last_updated: env.ledger().timestamp(),
            });

        user_pos.supplied_shares = user_pos
            .supplied_shares
            .checked_add(amount)
            .ok_or(Error::Overflow)?;
        user_pos.last_updated = env.ledger().timestamp();

        state.total_supplied = state
            .total_supplied
            .checked_add(amount)
            .ok_or(Error::Overflow)?;

        env.storage().persistent().set(&user_key, &user_pos);
        env.storage()
            .persistent()
            .set(&DataKey::Market(asset), &state);

        env.events().publish(
            (Symbol::new(&env, "supply"), user),
            (amount, state.total_supplied),
        );

        Ok(user_pos.supplied_shares)
    }

    /// Withdraw supplied liquidity from the pool.
    pub fn withdraw(env: Env, user: Address, asset: Address, amount: i128) -> Result<i128, Error> {
        user.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut state = Self::get_market_state_internal(&env, &asset)?;
        Self::accrue_interest_internal(&env, &mut state)?;

        let available_liquidity = state
            .total_supplied
            .checked_sub(state.total_borrowed)
            .ok_or(Error::Overflow)?;
        if amount > available_liquidity {
            return Err(Error::InsufficientLiquidity);
        }

        let user_key = DataKey::UserPosition(user.clone(), asset.clone());
        let mut user_pos: UserLendingPosition = env
            .storage()
            .persistent()
            .get(&user_key)
            .ok_or(Error::InsufficientLiquidity)?;

        if user_pos.supplied_shares < amount {
            return Err(Error::InsufficientLiquidity);
        }

        user_pos.supplied_shares = user_pos
            .supplied_shares
            .checked_sub(amount)
            .ok_or(Error::Overflow)?;
        user_pos.last_updated = env.ledger().timestamp();

        state.total_supplied = state
            .total_supplied
            .checked_sub(amount)
            .ok_or(Error::Overflow)?;

        env.storage().persistent().set(&user_key, &user_pos);
        env.storage()
            .persistent()
            .set(&DataKey::Market(asset.clone()), &state);

        // Transfer funds back to user
        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        env.events().publish(
            (Symbol::new(&env, "withdraw"), user),
            (amount, user_pos.supplied_shares),
        );

        Ok(user_pos.supplied_shares)
    }

    /// Borrow asset against deposited collateral.
    pub fn borrow(env: Env, user: Address, asset: Address, amount: i128) -> Result<i128, Error> {
        user.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut state = Self::get_market_state_internal(&env, &asset)?;
        if !state.is_active {
            return Err(Error::MarketPaused);
        }

        Self::accrue_interest_internal(&env, &mut state)?;

        let available_liquidity = state
            .total_supplied
            .checked_sub(state.total_borrowed)
            .ok_or(Error::Overflow)?;
        if amount > available_liquidity {
            return Err(Error::InsufficientLiquidity);
        }

        // Load and accrue the user's existing debt before checking borrowing capacity.
        let user_key = DataKey::UserPosition(user.clone(), asset.clone());
        let mut user_pos: UserLendingPosition = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or(UserLendingPosition {
                supplied_shares: 0,
                principal_borrowed: 0,
                borrow_index: state.borrow_index,
                last_updated: env.ledger().timestamp(),
            });

        if user_pos.principal_borrowed > 0 {
            let current_debt = Self::calculate_user_debt(&user_pos, state.borrow_index)?;
            user_pos.principal_borrowed = current_debt;
        }

        // Check borrowing capacity against real collateral value with Collateral Vault.
        // `current_debt` is passed in (rather than fetched by the vault via a call back
        // into this contract) since Soroban disallows cross-contract call cycles.
        let vault_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::CollateralVault)
            .ok_or(Error::NotInitialized)?;
        let vault_client = CollateralVaultPeerClient::new(&env, &vault_addr);
        if !vault_client.can_borrow(&user, &user_pos.principal_borrowed, &amount) {
            return Err(Error::InsufficientCollateral);
        }

        user_pos.principal_borrowed = user_pos
            .principal_borrowed
            .checked_add(amount)
            .ok_or(Error::Overflow)?;
        user_pos.borrow_index = state.borrow_index;
        user_pos.last_updated = env.ledger().timestamp();

        state.total_borrowed = state
            .total_borrowed
            .checked_add(amount)
            .ok_or(Error::Overflow)?;

        env.storage().persistent().set(&user_key, &user_pos);
        env.storage()
            .persistent()
            .set(&DataKey::Market(asset.clone()), &state);

        // Transfer borrowed asset to user
        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        env.events().publish(
            (Symbol::new(&env, "borrow"), user),
            (amount, user_pos.principal_borrowed),
        );

        Ok(user_pos.principal_borrowed)
    }

    /// Repay outstanding borrowed debt.
    pub fn repay(env: Env, user: Address, asset: Address, amount: i128) -> Result<i128, Error> {
        user.require_auth();
        Self::repay_internal(&env, &user, &user, &asset, amount)
    }

    /// Repay a borrower's debt on their behalf (permissionless repay-for, used by
    /// liquidation-engine but callable by anyone — tokens are pulled from `payer`).
    pub fn liquidation_repay(
        env: Env,
        payer: Address,
        borrower: Address,
        asset: Address,
        amount: i128,
    ) -> i128 {
        payer.require_auth();
        Self::repay_internal(&env, &payer, &borrower, &asset, amount).unwrap()
    }

    /// Read market state for an asset.
    pub fn get_market_state(env: Env, asset: Address) -> Result<MarketState, Error> {
        Self::get_market_state_internal(&env, &asset)
    }

    /// Read user position for an asset.
    pub fn get_user_position(env: Env, user: Address, asset: Address) -> UserLendingPosition {
        let user_key = DataKey::UserPosition(user, asset);
        env.storage()
            .persistent()
            .get(&user_key)
            .unwrap_or(UserLendingPosition {
                supplied_shares: 0,
                principal_borrowed: 0,
                borrow_index: SCALE,
                last_updated: env.ledger().timestamp(),
            })
    }

    // Helper functions
    fn get_market_state_internal(env: &Env, asset: &Address) -> Result<MarketState, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Market(asset.clone()))
            .ok_or(Error::MarketNotFound)
    }

    fn repay_internal(
        env: &Env,
        payer: &Address,
        borrower: &Address,
        asset: &Address,
        amount: i128,
    ) -> Result<i128, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut state = Self::get_market_state_internal(env, asset)?;
        Self::accrue_interest_internal(env, &mut state)?;

        let user_key = DataKey::UserPosition(borrower.clone(), asset.clone());
        let mut user_pos: UserLendingPosition = env
            .storage()
            .persistent()
            .get(&user_key)
            .ok_or(Error::InsufficientLiquidity)?;

        let total_debt = Self::calculate_user_debt(&user_pos, state.borrow_index)?;
        let repay_actual = if amount > total_debt {
            total_debt
        } else {
            amount
        };

        // Transfer tokens from payer to pool
        let token_client = token::Client::new(env, asset);
        token_client.transfer(payer, &env.current_contract_address(), &repay_actual);

        user_pos.principal_borrowed = total_debt
            .checked_sub(repay_actual)
            .ok_or(Error::Overflow)?;
        user_pos.borrow_index = state.borrow_index;
        user_pos.last_updated = env.ledger().timestamp();

        state.total_borrowed = state
            .total_borrowed
            .checked_sub(repay_actual)
            .ok_or(Error::Overflow)?;

        env.storage().persistent().set(&user_key, &user_pos);
        env.storage()
            .persistent()
            .set(&DataKey::Market(asset.clone()), &state);

        env.events().publish(
            (Symbol::new(env, "repay"), borrower.clone()),
            (repay_actual, user_pos.principal_borrowed),
        );

        Ok(user_pos.principal_borrowed)
    }

    fn accrue_interest_internal(env: &Env, state: &mut MarketState) -> Result<(), Error> {
        let current_time = env.ledger().timestamp();
        let time_delta = current_time.saturating_sub(state.last_accrual_time);
        if time_delta == 0 || state.total_borrowed == 0 {
            state.last_accrual_time = current_time;
            return Ok(());
        }

        let rate_model_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::RateModel)
            .ok_or(Error::NotInitialized)?;
        let rate_model_client = RateModelPeerClient::new(env, &rate_model_addr);
        let borrow_rate_bps =
            rate_model_client.get_borrow_rate(&state.total_borrowed, &state.total_supplied);

        // Convert annual bps rate to a per-elapsed-second interest factor, scaled by 1e9.
        let rate_per_sec = borrow_rate_bps.checked_mul(SCALE).ok_or(Error::Overflow)?
            / BPS_SCALE
            / SECONDS_PER_YEAR;
        let interest_factor = rate_per_sec.checked_mul(time_delta as i128).unwrap_or(0);

        let new_borrow_index = state
            .borrow_index
            .checked_add(state.borrow_index.checked_mul(interest_factor).unwrap_or(0) / SCALE)
            .unwrap_or(state.borrow_index);

        state.borrow_index = new_borrow_index;
        state.last_accrual_time = current_time;
        Ok(())
    }

    fn calculate_user_debt(
        user_pos: &UserLendingPosition,
        current_index: i128,
    ) -> Result<i128, Error> {
        if user_pos.principal_borrowed == 0 || user_pos.borrow_index == 0 {
            return Ok(0);
        }
        let debt = user_pos
            .principal_borrowed
            .checked_mul(current_index)
            .ok_or(Error::Overflow)?
            / user_pos.borrow_index;
        Ok(debt)
    }
}
