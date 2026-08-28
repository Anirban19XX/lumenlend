import type { StellarNetworkName } from '@lumenlend/stellar';

export const STELLAR_NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK as StellarNetworkName) || 'testnet';
export const STELLAR_RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Single-asset market: XLM is both the collateral and the borrow/supply asset.
export const CONTRACT_ADDRESSES = {
  lendingPool: process.env.NEXT_PUBLIC_LENDING_POOL_CONTRACT_ID || 'CDLENDINGPOOLPLACEHOLDER',
  collateralVault: process.env.NEXT_PUBLIC_COLLATERAL_VAULT_CONTRACT_ID || 'CDCOLLATERALVAULTPLACEHOLDER',
  liquidationEngine: process.env.NEXT_PUBLIC_LIQUIDATION_ENGINE_CONTRACT_ID || 'CDLIQUIDATIONENGINEPLACEHOLDER',
  oracleManager: process.env.NEXT_PUBLIC_ORACLE_MANAGER_CONTRACT_ID || 'CDORACLEMANAGERPLACEHOLDER',
  interestRateModel: process.env.NEXT_PUBLIC_INTEREST_RATE_MODEL_CONTRACT_ID || 'CDINTERESTRATEMODELPLACEHOLDER',
  xlm: process.env.NEXT_PUBLIC_XLM_CONTRACT_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCXLM',
};

export const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '';
