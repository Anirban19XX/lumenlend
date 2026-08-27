# Oracle Manager Contract

The `oracle-manager` provides a secure, decoupled price feed abstraction for asset valuations.

## Features

* **Staleness Protection**: Configurable max staleness window (default 1 hour).
* **Zero/Negative Price Rejection**: Protects against flash crashes or broken feed anomalies.
* **Fixed-Point Scaling**: Normalized to 9 decimals (`1e9 = $1.00 USD`).
* **Pluggable Architecture**: Allows easy migration from mock feeders to production Pyth/Band/Reflector oracles.
