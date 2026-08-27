#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RateModelError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidParameters = 4,
    Overflow = 5,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RateModelConfig {
    pub base_rate_bps: u32,           // e.g. 200 = 2%
    pub optimal_utilization_bps: u32, // e.g. 8000 = 80%
    pub slope_1_bps: u32,             // e.g. 500 = 5%
    pub slope_2_bps: u32,             // e.g. 5000 = 50%
}

#[contracttype]
pub enum DataKey {
    Admin,
    Config,
}

const BPS_SCALE: i128 = 10_000;

#[contract]
pub struct InterestRateModel;

#[contractimpl]
impl InterestRateModel {
    /// Initialize interest rate model parameters.
    pub fn initialize(
        env: Env,
        admin: Address,
        config: RateModelConfig,
    ) -> Result<(), RateModelError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(RateModelError::AlreadyInitialized);
        }
        admin.require_auth();

        if config.optimal_utilization_bps == 0 || config.optimal_utilization_bps >= 10_000 {
            return Err(RateModelError::InvalidParameters);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Config, &config);

        Ok(())
    }

    /// Calculate pool utilization in basis points (10000 = 100%).
    pub fn get_utilization(
        _env: Env,
        total_borrowed: i128,
        total_supplied: i128,
    ) -> Result<i128, RateModelError> {
        if total_supplied == 0 {
            return Ok(0);
        }
        if total_borrowed >= total_supplied {
            return Ok(BPS_SCALE);
        }

        let utilization = total_borrowed
            .checked_mul(BPS_SCALE)
            .ok_or(RateModelError::Overflow)?
            / total_supplied;

        Ok(utilization)
    }

    /// Calculate annual borrow rate (in basis points, e.g. 700 = 7.00% APR).
    pub fn get_borrow_rate(
        env: Env,
        total_borrowed: i128,
        total_supplied: i128,
    ) -> Result<i128, RateModelError> {
        let config: RateModelConfig = env
            .storage()
            .instance()
            .get(&DataKey::Config)
            .ok_or(RateModelError::NotInitialized)?;

        let utilization = Self::get_utilization(env, total_borrowed, total_supplied)?;
        let optimal = config.optimal_utilization_bps as i128;
        let base_rate = config.base_rate_bps as i128;
        let slope_1 = config.slope_1_bps as i128;
        let slope_2 = config.slope_2_bps as i128;

        if utilization <= optimal {
            // Rate = Base + (Utilization / Optimal) * Slope1
            let slope_component = utilization
                .checked_mul(slope_1)
                .ok_or(RateModelError::Overflow)?
                / optimal;
            let borrow_rate = base_rate
                .checked_add(slope_component)
                .ok_or(RateModelError::Overflow)?;
            Ok(borrow_rate)
        } else {
            // Rate = Base + Slope1 + ((Utilization - Optimal) / (100% - Optimal)) * Slope2
            let excess_utilization = utilization
                .checked_sub(optimal)
                .ok_or(RateModelError::Overflow)?;
            let max_excess = BPS_SCALE
                .checked_sub(optimal)
                .ok_or(RateModelError::Overflow)?;

            let slope2_component = excess_utilization
                .checked_mul(slope_2)
                .ok_or(RateModelError::Overflow)?
                / max_excess;

            let borrow_rate = base_rate
                .checked_add(slope_1)
                .ok_or(RateModelError::Overflow)?
                .checked_add(slope2_component)
                .ok_or(RateModelError::Overflow)?;

            Ok(borrow_rate)
        }
    }

    /// Calculate annual supply rate (in basis points) factoring in utilization and reserve factor.
    /// Supply Rate = Borrow Rate * Utilization * (1 - Reserve Factor)
    pub fn get_supply_rate(
        env: Env,
        total_borrowed: i128,
        total_supplied: i128,
        reserve_factor_bps: u32,
    ) -> Result<i128, RateModelError> {
        let borrow_rate = Self::get_borrow_rate(env.clone(), total_borrowed, total_supplied)?;
        let utilization = Self::get_utilization(env, total_borrowed, total_supplied)?;

        let gross_supply_rate = borrow_rate
            .checked_mul(utilization)
            .ok_or(RateModelError::Overflow)?
            / BPS_SCALE;

        let retain_factor = BPS_SCALE
            .checked_sub(reserve_factor_bps as i128)
            .ok_or(RateModelError::Overflow)?;

        let net_supply_rate = gross_supply_rate
            .checked_mul(retain_factor)
            .ok_or(RateModelError::Overflow)?
            / BPS_SCALE;

        Ok(net_supply_rate)
    }
}
