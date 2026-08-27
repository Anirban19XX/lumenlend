# Oracle Manager Specification

## Contract: `contracts/oracle-manager`

### Interface
* `get_price(env, asset) -> Result<i128, OracleError>`
* `get_price_with_timestamp(env, asset) -> Result<PriceRecord, OracleError>`
* `set_price(env, asset, price, decimals) -> Result<(), OracleError>`

### Price Validation Rules
1. **Zero / Negative Check**: Any price $\le 0$ immediately reverts with `OracleError::PriceInvalid`.
2. **Staleness Check**: If `current_time - last_timestamp > max_staleness` (default 3,600 seconds), invocation reverts with `OracleError::PriceStale`.
3. **Scaling**: Standardized to 9-decimal fixed-point precision ($10^9 = \$1.00\text{ USD}$).
