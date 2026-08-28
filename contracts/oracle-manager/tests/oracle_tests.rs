#![cfg(test)]

use oracle_manager::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_oracle_set_and_get_price() {
    let env = Env::default();
    let contract_id = env.register(OracleManager, ());
    let client = OracleManagerClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let xlm = Address::generate(&env);

    client.initialize(&admin, &Some(3600));

    // Set XLM price: $0.12 = 120_000_000 (1e9 scale)
    client.set_price(&xlm, &120_000_000, &9);

    let price = client.get_price(&xlm);
    assert_eq!(price, 120_000_000);
}
