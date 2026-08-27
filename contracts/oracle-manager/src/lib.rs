#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum OracleError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    PriceNotFound = 4,
    PriceStale = 5,
    PriceInvalid = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PriceRecord {
    pub price: i128,      // USD price scaled by 1e9 (e.g. $0.12 = 120_000_000)
    pub timestamp: u64,
    pub decimals: u32,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Price(Address),
    MaxStalenessSeconds,
}

const DEFAULT_MAX_STALENESS: u64 = 3600; // 1 hour

#[contract]
pub struct OracleManager;

#[contractimpl]
impl OracleManager {
    /// Initialize the Oracle Manager.
    pub fn initialize(env: Env, admin: Address, max_staleness_seconds: Option<u64>) -> Result<(), OracleError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(OracleError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(
            &DataKey::MaxStalenessSeconds,
            &max_staleness_seconds.unwrap_or(DEFAULT_MAX_STALENESS),
        );

        Ok(())
    }

    /// Set/update asset price (used by authorized feeder / mock in test environment).
    pub fn set_price(
        env: Env,
        asset: Address,
        price: i128,
        decimals: u32,
    ) -> Result<(), OracleError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(OracleError::NotInitialized)?;
        admin.require_auth();

        if price <= 0 {
            return Err(OracleError::PriceInvalid);
        }

        let record = PriceRecord {
            price,
            timestamp: env.ledger().timestamp(),
            decimals,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Price(asset.clone()), &record);

        env.events().publish(
            (Symbol::new(&env, "price_update"), asset),
            (price, record.timestamp),
        );

        Ok(())
    }

    /// Get current asset price with validation.
    pub fn get_price(env: Env, asset: Address) -> Result<i128, OracleError> {
        let record = Self::get_price_with_timestamp(env.clone(), asset)?;
        Ok(record.price)
    }

    /// Get current asset price and timestamp with staleness check.
    pub fn get_price_with_timestamp(
        env: Env,
        asset: Address,
    ) -> Result<PriceRecord, OracleError> {
        let record: PriceRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Price(asset))
            .ok_or(OracleError::PriceNotFound)?;

        if record.price <= 0 {
            return Err(OracleError::PriceInvalid);
        }

        let max_staleness: u64 = env
            .storage()
            .instance()
            .get(&DataKey::MaxStalenessSeconds)
            .unwrap_or(DEFAULT_MAX_STALENESS);

        let current_time = env.ledger().timestamp();
        if current_time.saturating_sub(record.timestamp) > max_staleness {
            return Err(OracleError::PriceStale);
        }

        Ok(record)
    }
}
