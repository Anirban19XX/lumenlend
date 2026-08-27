# Lending Pool Contract

The `lending-pool` contract manages liquidity provisioning, debt issuance, interest accrual, and reserve accumulation for supported assets on Stellar Soroban.

## Key Functions

* `initialize(admin, collateral_vault, rate_model)`: One-time setup of protocol parameters.
* `init_market(asset, reserve_factor_bps)`: Register an asset market.
* `supply(user, asset, amount)`: Supply asset liquidity to earn interest.
* `withdraw(user, asset, amount)`: Withdraw supplied liquidity.
* `borrow(user, asset, amount)`: Borrow against locked collateral.
* `repay(user, asset, amount)`: Repay borrowed debt.
* `get_market_state(asset)`: Returns total supplied, borrowed, index, and reserve data.
* `get_user_position(user, asset)`: Returns supplied shares and borrowed principal.

## Fixed-Point Math

All interest indices and rate multipliers use 9-decimal fixed-point precision (`1e9 = 1.0`).
Floating-point math is strictly prohibited.
