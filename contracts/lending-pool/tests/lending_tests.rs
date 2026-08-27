#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_lending_pool_initialization() {
    let env = Env::default();
    let contract_id = env.register(LendingPool, ());
    let client = LendingPoolClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let vault = Address::generate(&env);
    let rate_model = Address::generate(&env);

    client.initialize(&admin, &vault, &rate_model);
}
