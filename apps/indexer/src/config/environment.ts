import dotenv from 'dotenv';
import type { StellarNetworkName } from '@lumenlend/stellar';

dotenv.config();

export interface IndexerConfig {
  stellarNetwork: StellarNetworkName;
  rpcUrl: string;
  databaseUrl: string;
  port: number;
  pollIntervalMs: number;
  startLedger: number;
  contracts: {
    lendingPool: string;
    collateralVault: string;
    liquidationEngine: string;
    oracleManager: string;
    interestRateModel: string;
  };
}

export const config: IndexerConfig = {
  stellarNetwork: (process.env.STELLAR_NETWORK as StellarNetworkName) || 'testnet',
  rpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lumenlend',
  port: Number(process.env.INDEXER_PORT) || 4000,
  pollIntervalMs: Number(process.env.INDEXER_POLL_INTERVAL_MS) || 5000,
  startLedger: Number(process.env.INDEXER_START_LEDGER) || 0,
  contracts: {
    lendingPool: process.env.LENDING_POOL_CONTRACT_ID || '',
    collateralVault: process.env.COLLATERAL_VAULT_CONTRACT_ID || '',
    liquidationEngine: process.env.LIQUIDATION_ENGINE_CONTRACT_ID || '',
    oracleManager: process.env.ORACLE_MANAGER_CONTRACT_ID || '',
    interestRateModel: process.env.INTEREST_RATE_MODEL_CONTRACT_ID || '',
  },
};
