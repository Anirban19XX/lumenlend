# Security Threat Model & Analysis

> [!WARNING]
> **DISCLAIMER: LumenLend is experimental, un-audited software.**
> Do not deploy or use with real production funds without comprehensive formal verification and third-party security audits.

## 1. Threat Vectors and Mitigations

### 1.1 Arithmetic Overflow & Precision Loss
- **Threat**: Integer overflow, underflow, or division-by-zero causing protocol insolvency or infinite minting.
- **Mitigation**: Soroban Rust contracts enforce checked arithmetic (`checked_add`, `checked_mul`, `checked_sub`). Division operations use fixed-point scaling (`1e9` for price feeds, `10,000` for basis points). Zero-division checks protect every denominator. Floating-point numbers are strictly forbidden.

### 1.2 Authorization & Access Control
- **Threat**: Unauthorized actors draining pools, initiating unauthorized liquidations, or changing market risk parameters.
- **Mitigation**: Strict `user.require_auth()` enforcement on all funds movements (supply, withdraw, borrow, repay, collateral deposits). Administrative functions (`init_market`, `set_price`) require cryptographic admin authorization stored in contract instance storage.

### 1.3 Oracle Price Manipulation & Staleness
- **Threat**: Flash loans or oracle latency triggering malicious liquidations or excessive borrowing.
- **Mitigation**: The `OracleManager` checks timestamp staleness against `max_staleness_seconds` (rejecting stale updates) and rejects non-positive prices ($\le 0$).

### 1.4 Reentrancy & Cross-Contract Calls
- **Threat**: Malicious token fallback re-entering the pool before storage balances update.
- **Mitigation**: Soroban enforces atomic transaction execution and explicit authorization trees. State mutations (e.g., balance and index updates) occur strictly before external token transfers.

### 1.5 Bad Debt & Undercollateralization
- **Threat**: Rapid market drop making borrower collateral worth less than outstanding debt.
- **Mitigation**: 5% liquidation bonus and 80% liquidation threshold provide a 20% volatility safety buffer for liquidators before bad debt occurs. Protocol reserve factors accumulate insurance liquidity.
