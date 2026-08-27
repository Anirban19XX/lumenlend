import type { StellarNetworkName } from '@lumenlend/stellar';

export interface ProtocolContractAddresses {
  lendingPool: string;
  collateralVault: string;
  liquidationEngine: string;
  oracleManager: string;
  interestRateModel: string;
}

export interface ClientConfig {
  network: StellarNetworkName;
  rpcUrl?: string;
  contracts: ProtocolContractAddresses;
}

export interface ContractTransactionResult {
  txHash: string;
  status: 'SUCCESS' | 'FAILED';
  returnValue?: unknown;
}
