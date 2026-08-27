# Collateral Vault Specification

## Contract: `contracts/collateral-vault`

### Operations

* `deposit_collateral(env, user, amount)`: Safely locks collateral assets inside the vault.
* `withdraw_collateral(env, user, amount)`: Verifies position health factor $\ge 1.0$ post-withdrawal before transferring funds.
* `get_collateral(env, user)`: Fetches collateral balance for account.
* `get_health_factor(env, user)`: Computes current health factor.

### Safety Guarantee
Withdrawals are rejected on-chain if the user has outstanding debt and the resulting collateral falls below the liquidation threshold requirement.
