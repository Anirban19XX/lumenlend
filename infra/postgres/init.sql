-- LumenLend PostgreSQL Initial Schema

CREATE TABLE IF NOT EXISTS markets (
  market_id VARCHAR(64) PRIMARY KEY,
  collateral_asset_id VARCHAR(64) NOT NULL,
  borrow_asset_id VARCHAR(64) NOT NULL,
  total_supplied NUMERIC(38, 0) DEFAULT 0,
  total_borrowed NUMERIC(38, 0) DEFAULT 0,
  total_reserves NUMERIC(38, 0) DEFAULT 0,
  borrow_index NUMERIC(38, 0) DEFAULT 1000000000,
  supply_apy_bps INT DEFAULT 0,
  borrow_apy_bps INT DEFAULT 0,
  utilization_bps INT DEFAULT 0,
  collateral_price_usd NUMERIC(38, 0) DEFAULT 0,
  borrow_price_usd NUMERIC(38, 0) DEFAULT 1000000000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  address VARCHAR(64) PRIMARY KEY,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
  user_address VARCHAR(64) NOT NULL REFERENCES users(address),
  market_id VARCHAR(64) NOT NULL REFERENCES markets(market_id),
  supplied_amount NUMERIC(38, 0) DEFAULT 0,
  borrowed_amount NUMERIC(38, 0) DEFAULT 0,
  collateral_amount NUMERIC(38, 0) DEFAULT 0,
  health_factor_bps INT DEFAULT 999999,
  is_liquidatable BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_address, market_id)
);

CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(128) PRIMARY KEY,
  transaction_hash VARCHAR(128) NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  user_address VARCHAR(64) NOT NULL,
  market_id VARCHAR(64) NOT NULL,
  amount NUMERIC(38, 0) NOT NULL,
  ledger_sequence BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS indexer_cursors (
  contract_id VARCHAR(64) PRIMARY KEY,
  last_paging_token VARCHAR(128),
  last_ledger BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial XLM / USDC Market
INSERT INTO markets (
  market_id, collateral_asset_id, borrow_asset_id, total_supplied, total_borrowed,
  total_reserves, borrow_index, supply_apy_bps, borrow_apy_bps, utilization_bps,
  collateral_price_usd, borrow_price_usd, updated_at
) VALUES (
  'XLM-USDC-V1',
  'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCXLM',
  'CAQCFV44SC27F76B6J5SQ5F5Z2NV74G565TJX5NWLX2P7X76HGXUSDC7',
  12500000000000,
  5000000000000,
  25000000000,
  1000000000,
  162,
  450,
  4000,
  120000000,
  1000000000,
  NOW()
) ON CONFLICT (market_id) DO NOTHING;
