# Liquidation Engine Contract

The `liquidation-engine` protects protocol solvency by enabling external liquidators to repay delinquent loans in exchange for seizing collateral at a discount (liquidation bonus).

## Key Operations

* `liquidate(liquidator, borrower, repay_amount)`: Repays a portion of the undercollateralized debt up to `close_factor` and transfers corresponding collateral + bonus to the liquidator.
* `is_liquidatable(borrower)`: Checks if position health factor < 1.0.

## Safety Guarantees

* Liquidation conditions are evaluated strictly on-chain.
* Close factor prevents single-transaction complete liquidation when unnecessary.
