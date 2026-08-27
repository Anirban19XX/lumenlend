# Collateral Vault Contract

The `collateral-vault` contract safely custody user collateral assets (e.g. native XLM) and computes borrowing capacity and real-time health factors.

## Core Operations

* `deposit_collateral(user, amount)`: Locks collateral tokens.
* `withdraw_collateral(user, amount)`: Unlocks collateral, strictly validating that the user position stays above the liquidation threshold ($HF \ge 1.0$).
* `get_collateral(user)`: Fetches collateral balance for account.
* `get_health_factor(user)`: Returns current position health factor in basis points ($10,000 = 1.0$).
