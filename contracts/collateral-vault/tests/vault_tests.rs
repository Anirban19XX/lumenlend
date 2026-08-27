#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_collateral_vault_initialization() {
    let env = Env::default();
    let contract_id = env.register(CollateralVault, ());
    let client = CollateralVaultClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let pool = Address::generate(&env);
    let xlm = Address::generate(&env);
    let usdc = Address::generate(&env);

    let config = CollateralConfig {
        collateral_asset: xlm,
        borrow_asset: usdc,
        max_ltv_bps: 7500,
        liquidation_threshold_bps: 8000,
        is_enabled: true,
    };

    client.initialize(&admin, &oracle, &pool, &config);
}
