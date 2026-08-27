# System Overview

LumenLend is a modular, decentralized, permissionless lending and borrowing protocol built natively on **Stellar Soroban**.

```
                           ┌───────────────────────────┐
                           │      User & Freighter     │
                           └─────────────┬─────────────┘
                                         │ Invocations / Signatures
                                         ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       Stellar Soroban Environment                      │
   │                                                                        │
   │  ┌───────────────────────┐             ┌────────────────────────────┐  │
   │  │   Collateral Vault    │◄───────────►│        Lending Pool        │  │
   │  │   (XLM Lock / Health) │             │  (USDC Supply / Borrow)    │  │
   │  └───────────┬───────────┘             └─────────────┬──────────────┘  │
   │              │                                       │                 │
   │              ▼                                       ▼                 │
   │  ┌───────────────────────┐             ┌────────────────────────────┐  │
   │  │    Oracle Manager     │             │    Interest Rate Model     │  │
   │  │   (Price Feeds)       │             │    (Kinked Curve Math)     │  │
   │  └───────────────────────┘             └────────────────────────────┘  │
   │              ▲                                                         │
   │              │                                                         │
   │  ┌───────────┴───────────┐                                             │
   │  │   Liquidation Engine  │                                             │
   │  │   (Delinquent Seizure)│                                             │
   │  └───────────────────────┘                                             │
   └────────────────────────────────────────────────────────────────────────┘
                                         │ Contract Events
                                         ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                          Off-Chain Infrastructure                      │
   │                                                                        │
   │  ┌───────────────────────┐             ┌────────────────────────────┐  │
   │  │   Event Indexer &     │◄───────────►│     PostgreSQL Database    │  │
   │  │   Monitoring Workers  │             │     (Aggregated Analytics) │  │
   │  └───────────┬───────────┘             └────────────────────────────┘  │
   │              │                                                         │
   │              ▼ REST API                                                │
   │  ┌───────────────────────┐                                             │
   │  │  Next.js 15 Web App   │                                             │
   │  └───────────────────────┘                                             │
   └────────────────────────────────────────────────────────────────────────┘
```

## Protocol Architecture Components

1. **Lending Pool**: Manages pool liquidity, debt tracking with dynamic borrow index, and interest accrual.
2. **Collateral Vault**: Segregated custody for collateral assets with independent verification of safety bounds before permitting withdrawals.
3. **Liquidation Engine**: Dispassionately executes debt repayment and collateral seizure with bonus for accounts where $HF < 1.0$.
4. **Oracle Manager**: Decoupled interface to price oracles with staleness, zero-price, and precision sanity checks.
5. **Interest Rate Model**: Pure mathematical calculation of borrow and supply rates based on utilization.
