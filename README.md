# LumenLend

<p align="center">
  <strong>Permissionless, Decentralized Lending Protocol Built on Stellar Soroban</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Blockchain-Stellar%20Soroban-08B5E5?style=for-the-badge&logo=stellar" alt="Stellar Soroban" />
  <img src="https://img.shields.io/badge/Language-Rust%20%7C%20TypeScript-orange?style=for-the-badge&logo=rust" alt="Rust & TypeScript" />
  <img src="https://img.shields.io/badge/Frontend-Next.js%2015-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

---

## 1. What is LumenLend?

**LumenLend** is a production-grade, permissionless decentralized lending protocol engineered specifically for the **Stellar** network using **Soroban** smart contracts.

The initial implementation powers the **XLM Collateral → USDC Borrowing** market:
* **Suppliers**: Deposit USDC liquidity into the pool to earn dynamic, utilization-driven APY.
* **Borrowers**: Lock native XLM into isolated collateral vaults and borrow USDC up to a 75% Maximum Loan-to-Value (LTV).
* **Interest Accrual**: Borrowers compound interest calculated via a kinked utilization-based interest rate model.
* **Solvency Protection**: Positions with Health Factor below 1.0 can be permissionlessly liquidated with a 5% liquidation bonus.

---

## 2. Why Stellar Soroban?

1. **Sub-second Settlement & Deterministic Finality**: Instant collateral locking and repayment confirmations.
2. **Predictable, Micro-cent Fees**: Eliminates high gas spikes that often lead to cascading liquidations on other chains.
3. **Native Asset Interoperability**: Direct integration with Stellar Asset Contracts (SAC) and anchor-issued stablecoins like USDC.
4. **Rust-Powered Contract Safety**: Memory safety, explicit authorization trees (`require_auth`), and resource metering.

---
## 📸 Screenshots

### 1. Dashboard
<img width="1917" height="871" alt="Screenshot 2026-08-28 152606" src="https://github.com/user-attachments/assets/9c4ea808-eee8-4165-9a20-badd52f0b008" />

---

### 2. Available Markets
<img width="1917" height="867" alt="Screenshot 2026-08-28 152634" src="https://github.com/user-attachments/assets/6b3c614f-ebfa-4343-a2b9-7d9c2b73654f" />

---
### 3. Lending Markets
<img width="1913" height="856" alt="Screenshot 2026-08-28 152702" src="https://github.com/user-attachments/assets/523f48ff-cb71-478a-9f1b-b3f443cc9f25" />



## 3. Architecture

```
lumenlend/
│
├── apps/
│   ├── web/                    # Next.js 15 App Router Frontend + Tailwind CSS
│   └── indexer/                # Node.js + TypeScript Event Indexer & REST API
│
├── contracts/                  # Soroban Smart Contracts (Rust)
│   ├── lending-pool/           # Core pool liquidity & debt accounting
│   ├── collateral-vault/       # Locked collateral custody & health factor checks
│   ├── liquidation-engine/     # On-chain liquidation validation & execution
│   ├── oracle-manager/         # Price feed abstraction & staleness guards
│   └── interest-rate-model/    # Kinked utilization interest curves
│
├── packages/                   # Shared Monorepo Packages
│   ├── shared/                 # Protocol types, fixed-point math & constants
│   ├── stellar/                # Freighter wallet & Soroban RPC connectors
│   ├── contracts-client/       # Strongly typed TypeScript contract clients
│   └── ui/                     # Reusable glassmorphic DeFi UI component library
│
├── scripts/                    # Build, deployment, and testnet setup automation
├── infra/                      # Docker & PostgreSQL schema definitions
├── docs/                       # Comprehensive architectural & security specs
└── tests/                      # Integration and end-to-end test suites
```

---

## 4. Quickstart & Local Development

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Rust stable with `wasm32-unknown-unknown` target
- Freighter wallet browser extension

### Installation

```bash
# 1. Clone repository
git clone https://github.com/lumenlend/lumenlend.git
cd lumenlend

# 2. Install workspace dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
```

---

## 5. Running Tests

```bash
# Run all unit and integration test suites
pnpm test

# Run specific package tests
pnpm --filter @lumenlend/shared test
pnpm --filter @lumenlend/indexer test
pnpm --filter @lumenlend/tests test
```

---

## 6. Building Contracts

```bash
# Compile Rust contracts to WASM targets
pnpm build:contracts

# Generate TypeScript client bindings from contract WASMs
pnpm generate:bindings
```

---

## 7. Running Applications

```bash
# Start Next.js Frontend (http://localhost:3000)
pnpm dev:web

# Start Indexer & REST API (http://localhost:4000)
pnpm dev:indexer
```

---

## 8. Deploying to Stellar Testnet

```bash
# 1. Deploy all protocol contracts
pnpm deploy:testnet

# 2. Configure initial XLM / USDC market parameters
pnpm initialize:market
```

---

## 9. Smart Contract Architecture

| Contract | Core Responsibilities | Key Functions |
| :--- | :--- | :--- |
| **`lending-pool`** | Liquidity supply, withdrawals, debt issuance, index tracking | `supply`, `withdraw`, `borrow`, `repay`, `get_market_state` |
| **`collateral-vault`** | Collateral locking, health factor valuation, safety checks | `deposit_collateral`, `withdraw_collateral`, `get_health_factor` |
| **`liquidation-engine`** | Delinquency verification, debt repayment, collateral seizure | `liquidate`, `is_liquidatable` |
| **`oracle-manager`** | Normalized 9-decimal price feeds, staleness rejection | `get_price`, `get_price_with_timestamp`, `set_price` |
| **`interest-rate-model`** | Kinked curve interest rates ($80\%$ optimal utilization) | `get_utilization`, `get_borrow_rate`, `get_supply_rate` |

---

## 10. Security Disclaimer

> [!WARNING]
> **LumenLend is experimental, un-audited software.**
> All contracts and financial calculations are provided for evaluation and development purposes. Do not deploy or risk real funds without professional third-party audits & formal security verification.

---
## 11. Contract Addresses

| Contract                | Address                                                    |
| ----------------------- | ---------------------------------------------------------- |
| **Oracle Manager**      | `CAKTM6Q7FIMTBEMXC3P5KELGCWEX5S7VM5HIJPRUX4PH66OHSBO6BWC2` |
| **Collateral Vault**    | `CD6MDTVKO5KMJEQIEGLAP53VLLKF2CZY4QLPPORYVU6WPDHT5NUBQJR3` |
| **Lending Pool**        | `CCCU57MOTALZTW76ATNO4XTFZW2D3RH64UO4RRJWGO3WHK7MNPHUURVL` |
| **Liquidation Engine**  | `CC3GG4QTTC22KCT35IK2HUKIRP7CZFLKFKWRQI3ID3I262BWYHDFWMD3` |
| **Interest Rate Model** | `CAZUXLCCTASYDQEATWODPDGR62J3YSAGBK4TQ4QHOMZL3URRUUMSKFOZ` |
| **XLM Asset (SAC)**     | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

###  View on Stellar Expert

Replace `<address>` with the contract address:

`https://stellar.expert/explorer/testnet/contract/<address>`

> **Network:** Stellar Testnet


## 12. Protocol Roadmap

- [x] **Milestone 1**: Monorepo architecture, Soroban contracts, Freighter wallet connector, Next.js frontend, Indexer, and integration tests.
- [ ] **Milestone 2**: Testnet deployment verification, Pyth Network oracle live feed integration, and SAC token multi-asset support.
- [ ] **Milestone 3**: Isolated risk markets (BTC/USDC, ETH/USDC, RWA/USDC) and flash loan provider modules.
- [ ] **Milestone 4**: Formal verification, security audit remediation, and mainnet launch.

---

## License

MIT License. Copyright (c) 2026 LumenLend Protocol.
