/**
 * Core protocol data structures and types for LumenLend
 */

export interface Asset {
  symbol: string;
  name: string;
  decimals: number;
  contractId: string;
  issuer?: string;
  icon?: string;
}

export interface MarketConfig {
  marketId: string;
  collateralAsset: Asset;
  borrowAsset: Asset;
  maxLtvBps: number;              // e.g. 7500 = 75% max loan to value
  liquidationThresholdBps: number;// e.g. 8000 = 80% liquidation threshold
  liquidationBonusBps: number;    // e.g. 500 = 5% liquidation bonus
  reserveFactorBps: number;       // e.g. 1000 = 10% reserve factor
  optimalUtilizationBps: number;  // e.g. 8000 = 80% optimal utilization
  baseRateBps: number;            // e.g. 200 = 2% base borrow rate
  slope1Bps: number;              // e.g. 500 = 5% slope 1
  slope2Bps: number;              // e.g. 5000 = 50% slope 2
  enabled: boolean;
}

export interface MarketState {
  marketId: string;
  totalSupply: bigint;
  totalBorrowed: bigint;
  totalReserves: bigint;
  supplyApyBps: number;
  borrowApyBps: number;
  utilizationBps: number;
  collateralPriceUsd: bigint; // scaled by 1e9
  borrowPriceUsd: bigint;     // scaled by 1e9
  lastUpdatedTimestamp: number;
}

export interface Market {
  config: MarketConfig;
  state: MarketState;
}

export interface UserPosition {
  userAddress: string;
  marketId: string;
  suppliedAmount: bigint;
  borrowedAmount: bigint;
  collateralAmount: bigint;
  collateralValueUsd: bigint; // scaled by 1e9
  borrowedValueUsd: bigint;   // scaled by 1e9
  borrowCapacityUsd: bigint;  // scaled by 1e9
  availableToBorrowUsd: bigint; // scaled by 1e9
  healthFactorBps: number;    // 10000 = 1.0 (Safe > 15000, Warning 10000-15000, Danger < 10000)
  healthFactorStatus?: HealthFactor['status'];
  isLiquidatable: boolean;
  lastUpdated: number;
}

export interface HealthFactor {
  score: number; // Decimal representation (e.g. 1.85)
  basisPoints: number; // Basis points (18500)
  status: 'safe' | 'warning' | 'danger' | 'liquidatable' | 'infinite';
}

export interface ProtocolStats {
  totalValueLockedUsd: bigint; // scaled by 1e9
  totalSuppliedUsd: bigint;
  totalBorrowedUsd: bigint;
  totalCollateralUsd: bigint;
  totalReservesUsd: bigint;
  activeUsersCount: number;
  marketsCount: number;
}

export interface Transaction {
  id: string;
  hash: string;
  type: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'deposit_collateral' | 'withdraw_collateral' | 'liquidate';
  userAddress: string;
  marketId: string;
  assetSymbol: string;
  amount: bigint;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  ledgerNumber?: number;
}

export interface LiquidationEvent {
  id: string;
  transactionHash: string;
  liquidator: string;
  borrower: string;
  marketId: string;
  repaidDebtAmount: bigint;
  seizedCollateralAmount: bigint;
  liquidationBonusBps: number;
  timestamp: number;
}
