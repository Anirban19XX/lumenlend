#![cfg(test)]

use interest_rate_model::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_kinked_interest_rates() {
    let env = Env::default();
    let contract_id = env.register(InterestRateModel, ());
    let client = InterestRateModelClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let config = RateModelConfig {
        base_rate_bps: 200,            // 2.0%
        optimal_utilization_bps: 8000, // 80.0%
        slope_1_bps: 500,              // 5.0%
        slope_2_bps: 5000,             // 50.0%
    };

    client.initialize(&admin, &config);

    // Test 1: 0% utilization -> Borrow Rate = Base Rate (2.0%)
    let rate_zero = client.get_borrow_rate(&0, &1_000_000);
    assert_eq!(rate_zero, 200);

    // Test 2: 40% utilization (halfway to optimal) -> Base (200) + 0.5 * Slope1 (250) = 450 (4.5%)
    let rate_half = client.get_borrow_rate(&400_000, &1_000_000);
    assert_eq!(rate_half, 450);

    // Test 3: 80% optimal utilization -> Base (200) + Slope1 (500) = 700 (7.0%)
    let rate_opt = client.get_borrow_rate(&800_000, &1_000_000);
    assert_eq!(rate_opt, 700);

    // Test 4: 90% utilization (above optimal) -> Base (200) + Slope1 (500) + 0.5 * Slope2 (2500) = 3200 (32.0%)
    let rate_high = client.get_borrow_rate(&900_000, &1_000_000);
    assert_eq!(rate_high, 3200);
}
