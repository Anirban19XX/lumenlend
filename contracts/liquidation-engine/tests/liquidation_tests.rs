#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_liquidation_engine_init() {
    let env = Env::default();
    let contract_id = env.register(LiquidationEngine, ());
    let client = LiquidationEngineClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let vault = Address::generate(&env);
    let pool = Address::generate(&env);
    let oracle = Address::generate(&env);

    let config = LiquidationConfig {
        liquidation_bonus_bps: 500, // 5% bonus
        close_factor_bps: 5000,     // 50%
        is_enabled: true,
    };

    client.initialize(&admin, &vault, &pool, &oracle, &config);
}
