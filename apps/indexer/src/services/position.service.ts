import {
  calculateBorrowCapacity,
  DEFAULT_XLM_USDC_MARKET_CONFIG,
  tokenAmountToUsd,
  type UserPosition,
} from '@lumenlend/shared';
import { repository } from '../db/repository.js';
import { healthFactorService } from './health-factor.service.js';

export class PositionService {
  async getPosition(userAddress: string, marketId: string = 'XLM-USDC-V1'): Promise<UserPosition> {
    const raw = await repository.getUserPosition(userAddress, marketId);

    const suppliedAmount = BigInt(raw?.supplied_amount || '0');
    const borrowedAmount = BigInt(raw?.borrowed_amount || '0');
    const collateralAmount = BigInt(raw?.collateral_amount || '0');

    // Default prices: XLM = $0.12 (120_000_000 in 1e9), USDC = $1.00 (1e9)
    const collateralPriceUsd = 120_000_000n;
    const borrowPriceUsd = 1_000_000_000n;

    const collateralValueUsd = tokenAmountToUsd(collateralAmount, 7, collateralPriceUsd);
    const borrowedValueUsd = tokenAmountToUsd(borrowedAmount, 7, borrowPriceUsd);
    const borrowCapacityUsd = calculateBorrowCapacity(collateralValueUsd, DEFAULT_XLM_USDC_MARKET_CONFIG.maxLtvBps);

    const availableToBorrowUsd = borrowCapacityUsd > borrowedValueUsd
      ? borrowCapacityUsd - borrowedValueUsd
      : 0n;

    const hf = healthFactorService.computeHealthFactor(
      collateralValueUsd,
      borrowedValueUsd,
      DEFAULT_XLM_USDC_MARKET_CONFIG.liquidationThresholdBps
    );

    return {
      userAddress,
      marketId,
      suppliedAmount,
      borrowedAmount,
      collateralAmount,
      collateralValueUsd,
      borrowedValueUsd,
      borrowCapacityUsd,
      availableToBorrowUsd,
      healthFactorBps: hf.basisPoints,
      isLiquidatable: hf.status === 'liquidatable',
      lastUpdated: raw?.updated_at ? new Date(raw.updated_at).getTime() : Date.now(),
    };
  }

  async updateCollateral(userAddress: string, marketId: string, deltaAmount: bigint, isDeposit: boolean): Promise<void> {
    const raw = await repository.getUserPosition(userAddress, marketId);
    let current = BigInt(raw?.collateral_amount || '0');
    current = isDeposit ? current + deltaAmount : current - deltaAmount;
    if (current < 0n) current = 0n;

    await repository.saveUserPosition({
      user_address: userAddress,
      market_id: marketId,
      supplied_amount: raw?.supplied_amount || '0',
      borrowed_amount: raw?.borrowed_amount || '0',
      collateral_amount: current.toString(),
      health_factor_bps: raw?.health_factor_bps || 999999,
      is_liquidatable: false,
    });
  }

  async updateSupply(userAddress: string, marketId: string, deltaAmount: bigint, isSupply: boolean): Promise<void> {
    const raw = await repository.getUserPosition(userAddress, marketId);
    let current = BigInt(raw?.supplied_amount || '0');
    current = isSupply ? current + deltaAmount : current - deltaAmount;
    if (current < 0n) current = 0n;

    await repository.saveUserPosition({
      user_address: userAddress,
      market_id: marketId,
      supplied_amount: current.toString(),
      borrowed_amount: raw?.borrowed_amount || '0',
      collateral_amount: raw?.collateral_amount || '0',
      health_factor_bps: raw?.health_factor_bps || 999999,
      is_liquidatable: false,
    });
  }

  async updateBorrow(userAddress: string, marketId: string, deltaAmount: bigint, isBorrow: boolean): Promise<void> {
    const raw = await repository.getUserPosition(userAddress, marketId);
    let current = BigInt(raw?.borrowed_amount || '0');
    current = isBorrow ? current + deltaAmount : current - deltaAmount;
    if (current < 0n) current = 0n;

    await repository.saveUserPosition({
      user_address: userAddress,
      market_id: marketId,
      supplied_amount: raw?.supplied_amount || '0',
      borrowed_amount: current.toString(),
      collateral_amount: raw?.collateral_amount || '0',
      health_factor_bps: raw?.health_factor_bps || 999999,
      is_liquidatable: false,
    });
  }
}

export const positionService = new PositionService();
