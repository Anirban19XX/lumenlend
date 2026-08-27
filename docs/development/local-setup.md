# Local Development Setup Guide

## Prerequisites

- **Node.js**: v20.x or v22.x
- **pnpm**: v9.x or v10.x (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Rust**: `rustup target add wasm32-unknown-unknown`
- **Docker & Docker Compose** (Optional for local PostgreSQL)
- **Freighter Browser Extension**

## Step-by-Step Instructions

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/lumenlend/lumenlend.git
cd lumenlend
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Run Automated Tests
```bash
# Run unit & integration test suites
pnpm test
```

### 4. Start Local Development Servers
```bash
# Start Next.js frontend (http://localhost:3000)
pnpm dev:web

# In a second terminal, start the indexer & API (http://localhost:4000)
pnpm dev:indexer
```

### 5. Build Smart Contracts (Rust / Soroban)
```bash
pnpm build:contracts
```

### 6. Deploy to Stellar Testnet
```bash
pnpm deploy:testnet
pnpm initialize:market
```
