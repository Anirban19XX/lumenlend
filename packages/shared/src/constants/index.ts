import type { Asset, MarketConfig } from '../types/market.js';

export const BPS_DIVISOR = 10_000n;
export const PRICE_PRECISION = 1_000_000_000n; // 1e9 USD precision
export const STROOP_PRECISION = 10_000_000n;   // 1e7 Stellar stroops
export const SECONDS_PER_YEAR = 31_536_000n;

// Default initial testnet assets
export const DEFAULT_XLM_ASSET: Asset = {
  symbol: 'XLM',
  name: 'Stellar Lumens',
  decimals: 7,
  contractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
};

export const DEFAULT_USDC_ASSET: Asset = {
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 7,
  contractId: 'CAQCFV44SC27F76B6J5SQ5F5Z2NV74G565TJX5NWLX2P7X76HGXUSDC7',
};

// Initial XLM / USDC Lending Market Configuration
export const DEFAULT_XLM_USDC_MARKET_CONFIG: MarketConfig = {
  marketId: 'XLM-USDC-V1',
  collateralAsset: DEFAULT_XLM_ASSET,
  borrowAsset: DEFAULT_USDC_ASSET,
  maxLtvBps: 7500,               // 75% max borrow capacity
  liquidationThresholdBps: 8000, // 80% liquidation threshold
  liquidationBonusBps: 500,      // 5% bonus to liquidator
  reserveFactorBps: 1000,        // 10% reserve factor
  optimalUtilizationBps: 8000,   // 80% kink point
  baseRateBps: 200,              // 2% base rate
  slope1Bps: 500,                // 5% slope up to optimal
  slope2Bps: 5000,               // 50% slope above optimal
  enabled: true,
};
