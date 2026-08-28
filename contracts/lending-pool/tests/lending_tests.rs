#![cfg(test)]

use super::*;
use soroban_sdk::{contract, contractimpl, testutils::Address as _, token, Address, Env};

#[contract]
struct MockCollateralVault;

#[contractimpl]
impl CollateralVaultPeer for MockCollateralVault {
    fn can_borrow(_env: Env, _user: Address, _current_debt: i128, _additional_borrow_amount: i128) -> bool {
        true
    }
}

#[contract]
struct MockRateModel;

#[contractimpl]
impl RateModelPeer for MockRateModel {
    fn get_borrow_rate(_env: Env, _total_borrowed: i128, _total_supplied: i128) -> i128 {
        0
    }
}

struct Fixture {
    env: Env,
    pool: Address,
    asset: Address,
    user: Address,
}

fn fixture() -> Fixture {
    let env = Env::default();
    env.mock_all_auths();
    let pool_id = env.register(LendingPool, ());
    let admin = Address::generate(&env);
    let vault_id = env.register(MockCollateralVault, ());
    let rate_model_id = env.register(MockRateModel, ());
    let asset = env.register_stellar_asset_contract_v2(Address::generate(&env)).address();
    let user = Address::generate(&env);

    let client = LendingPoolClient::new(&env, &pool_id);
    client.initialize(&admin, &vault_id, &rate_model_id);
    client.init_market(&asset, &0);

    Fixture { env, pool: pool_id, asset, user }
}

fn client(fixture: &Fixture) -> LendingPoolClient<'_> {
    LendingPoolClient::new(&fixture.env, &fixture.pool)
}

fn fund(fixture: &Fixture, amount: i128) {
    token::StellarAssetClient::new(&fixture.env, &fixture.asset).mint(&fixture.user, &amount);
}

fn supply(fixture: &Fixture, amount: i128) {
    fund(fixture, amount);
    client(fixture).supply(&fixture.user, &fixture.asset, &amount);
}

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

#[test]
fn test_initialization_twice_is_rejected() {
    let fixture = fixture();
    let admin = Address::generate(&fixture.env);
    let vault = Address::generate(&fixture.env);
    let rate_model = Address::generate(&fixture.env);

    assert_eq!(client(&fixture).try_initialize(&admin, &vault, &rate_model).unwrap_err().unwrap(), Error::AlreadyInitialized);
}

#[test]
fn test_unauthorized_initialization_is_rejected() {
    let env = Env::default();
    let contract_id = env.register(LendingPool, ());
    let client = LendingPoolClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let vault = Address::generate(&env);
    let rate_model = Address::generate(&env);

    assert!(client.try_initialize(&admin, &vault, &rate_model).is_err());
}

#[test]
fn test_zero_and_negative_amounts_are_rejected() {
    let fixture = fixture();
    for amount in [0, -1] {
        assert_eq!(client(&fixture).try_supply(&fixture.user, &fixture.asset, &amount).unwrap_err().unwrap(), Error::InvalidAmount);
        assert_eq!(client(&fixture).try_withdraw(&fixture.user, &fixture.asset, &amount).unwrap_err().unwrap(), Error::InvalidAmount);
        assert_eq!(client(&fixture).try_repay(&fixture.user, &fixture.asset, &amount).unwrap_err().unwrap(), Error::InvalidAmount);
    }
}

#[test]
fn test_supply_and_multiple_supplies_update_balances() {
    let fixture = fixture();
    supply(&fixture, 100);
    supply(&fixture, 50);

    let position = client(&fixture).get_user_position(&fixture.user, &fixture.asset);
    let state = client(&fixture).get_market_state(&fixture.asset).unwrap();
    assert_eq!(position.supplied_shares, 150);
    assert_eq!(state.total_supplied, 150);
}

#[test]
fn test_partial_withdrawal_updates_user_and_market() {
    let fixture = fixture();
    supply(&fixture, 100);

    client(&fixture).withdraw(&fixture.user, &fixture.asset, &40);

    assert_eq!(client(&fixture).get_user_position(&fixture.user, &fixture.asset).supplied_shares, 60);
    assert_eq!(client(&fixture).get_market_state(&fixture.asset).unwrap().total_supplied, 60);
}

#[test]
fn test_withdrawal_exceeding_user_balance_is_rejected() {
    let fixture = fixture();
    supply(&fixture, 100);

    assert_eq!(client(&fixture).try_withdraw(&fixture.user, &fixture.asset, &101).unwrap_err().unwrap(), Error::InsufficientLiquidity);
}

#[test]
fn test_withdrawal_exceeding_available_liquidity_is_rejected() {
    let fixture = fixture();
    supply(&fixture, 100);

    client(&fixture).borrow(&fixture.user, &fixture.asset, &60);
    assert_eq!(client(&fixture).try_withdraw(&fixture.user, &fixture.asset, &41).unwrap_err().unwrap(), Error::InsufficientLiquidity);
}

#[test]
fn test_borrow_with_insufficient_liquidity_is_rejected() {
    let fixture = fixture();
    assert_eq!(client(&fixture).try_borrow(&fixture.user, &fixture.asset, &1).unwrap_err().unwrap(), Error::InsufficientLiquidity);
}

#[test]
fn test_repayment_larger_than_debt_is_capped_and_exact_repayment_clears_debt() {
    let fixture = fixture();
    supply(&fixture, 100);

    // Borrowing requires collateral in the peer contract in production. This fixture's peer
    // allows it, while the user receives the pool's supplied asset for repayment.
    client(&fixture).borrow(&fixture.user, &fixture.asset, &20);
    fund(&fixture, 20);
    client(&fixture).repay(&fixture.user, &fixture.asset, &20);
    assert_eq!(client(&fixture).get_user_position(&fixture.user, &fixture.asset).principal_borrowed, 0);

    client(&fixture).borrow(&fixture.user, &fixture.asset, &20);
    fund(&fixture, 30);
    client(&fixture).repay(&fixture.user, &fixture.asset, &30);
    assert_eq!(client(&fixture).get_user_position(&fixture.user, &fixture.asset).principal_borrowed, 0);
}

#[test]
fn test_multiple_borrow_and_repay_operations() {
    let fixture = fixture();
    supply(&fixture, 100);

    client(&fixture).borrow(&fixture.user, &fixture.asset, &20);
    fund(&fixture, 10);
    client(&fixture).repay(&fixture.user, &fixture.asset, &10);
    client(&fixture).borrow(&fixture.user, &fixture.asset, &15);

    assert_eq!(client(&fixture).get_user_position(&fixture.user, &fixture.asset).principal_borrowed, 25);
}

#[test]
fn test_overflow_sensitive_supply_boundary_is_rejected() {
    let fixture = fixture();
    let amount = i128::MAX;
    fund(&fixture, amount);
    client(&fixture).supply(&fixture.user, &fixture.asset, &amount);
    fund(&fixture, 1);
    assert_eq!(client(&fixture).try_supply(&fixture.user, &fixture.asset, &1).unwrap_err().unwrap(), Error::Overflow);
}
