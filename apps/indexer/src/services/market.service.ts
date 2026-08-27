import {
  calculateBorrowRate,
  calculateSupplyRate,
  calculateUtilization,
  DEFAULT_USDC_ASSET,
  DEFAULT_XLM_ASSET,
  DEFAULT_XLM_USDC_MARKET_CONFIG,
  type Market,
  type ProtocolStats,
} from '@lumenlend/shared';
import { repository } from '../db/repository.js';

export class MarketService {
  async getMarket(marketId: string = 'XLM-USDC-V1'): Promise<Market> {
    const raw = await repository.getMarket(marketId);

    const totalSupply = BigInt(raw?.total_supplied || '10000000000000'); // Default 1,000,000 USDC
    const totalBorrowed = BigInt(raw?.total_borrowed || '4000000000000'); // Default 400,000 USDC
    const totalReserves = BigInt(raw?.total_reserves || '50000000000');

    const utilBps = calculateUtilization(totalBorrowed, totalSupply);
    const borrowApyBps = calculateBorrowRate(utilBps, DEFAULT_XLM_USDC_MARKET_CONFIG);
    const supplyApyBps = calculateSupplyRate(borrowApyBps, utilBps, DEFAULT_XLM_USDC_MARKET_CONFIG.reserveFactorBps);

    return {
      config: DEFAULT_XLM_USDC_MARKET_CONFIG,
      state: {
        marketId,
        totalSupply,
        totalBorrowed,
        totalReserves,
        utilizationBps: utilBps,
        borrowApyBps,
        supplyApyBps,
        collateralPriceUsd: 120_000_000n, // $0.12 (1e9)
        borrowPriceUsd: 1_000_000_000n,   // $1.00 (1e9)
        lastUpdatedTimestamp: Date.now(),
      },
    };
  }

  async getProtocolStats(): Promise<ProtocolStats> {
    const market = await this.getMarket();
    const totalSuppliedUsd = (market.state.totalSupply * 1_000_000_000n) / 10_000_000n;
    const totalBorrowedUsd = (market.state.totalBorrowed * 1_000_000_000n) / 10_000_000n;
    const totalCollateralUsd = 2_500_000_000_000n; // $2,500,000 TVL
    const totalValueLockedUsd = totalCollateralUsd + totalSuppliedUsd;

    return {
      totalValueLockedUsd,
      totalSuppliedUsd,
      totalBorrowedUsd,
      totalCollateralUsd,
      totalReservesUsd: (market.state.totalReserves * 1_000_000_000n) / 10_000_000n,
      activeUsersCount: 142,
      marketsCount: 1,
    };
  }
}

export const marketService = new MarketService();
