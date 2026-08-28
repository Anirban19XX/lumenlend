import { BPS_DIVISOR } from '../constants/index.js';
import type { HealthFactor, MarketConfig } from '../types/market.js';
import { applyBps, mulDivDown } from './fixed-point.js';

/**
 * Calculate pool utilization in basis points (10000 = 100%).
 */
export function calculateUtilization(
  totalBorrowed: bigint,
  totalSupply: bigint
): number {
  if (totalBorrowed < 0n || totalSupply < 0n) throw new Error('Negative amount in calculateUtilization');
  if (totalSupply === 0n) return 0;
  if (totalBorrowed >= totalSupply) return 10_000;
  return Number((totalBorrowed * BPS_DIVISOR) / totalSupply);
}

/**
 * Calculate annual borrow rate (in basis points) using the kinked model.
 */
export function calculateBorrowRate(
  utilizationBps: number,
  config: Pick<MarketConfig, 'baseRateBps' | 'optimalUtilizationBps' | 'slope1Bps' | 'slope2Bps'>
): number {
  const { baseRateBps, optimalUtilizationBps, slope1Bps, slope2Bps } = config;
  if (!Number.isSafeInteger(utilizationBps) || utilizationBps < 0 || utilizationBps > 10_000) {
    throw new Error('Invalid utilization in calculateBorrowRate');
  }
  if ([baseRateBps, optimalUtilizationBps, slope1Bps, slope2Bps].some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error('Invalid rate configuration');
  }
  if (optimalUtilizationBps > 10_000) throw new Error('Invalid optimal utilization');

  if (utilizationBps <= optimalUtilizationBps) {
    if (optimalUtilizationBps === 0) return baseRateBps;
    const slope1Portion = (utilizationBps * slope1Bps) / optimalUtilizationBps;
    return Math.floor(baseRateBps + slope1Portion);
  } else {
    const excess = utilizationBps - optimalUtilizationBps;
    const maxExcess = 10_000 - optimalUtilizationBps;
    const slope2Portion = (excess * slope2Bps) / maxExcess;
    return Math.floor(baseRateBps + slope1Bps + slope2Portion);
  }
}

/**
 * Calculate annual supply rate (in basis points) factoring in pool utilization and protocol reserve factor.
 */
export function calculateSupplyRate(
  borrowRateBps: number,
  utilizationBps: number,
  reserveFactorBps: number
): number {
  if ([borrowRateBps, utilizationBps, reserveFactorBps].some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error('Invalid rate input');
  }
  if (utilizationBps > 10_000) throw new Error('Invalid utilization in calculateSupplyRate');
  if (reserveFactorBps > 10_000) throw new Error('Invalid reserve factor');
  // Supply Rate = Borrow Rate * Utilization * (1 - Reserve Factor)
  const grossSupplyBps = (borrowRateBps * utilizationBps) / 10_000;
  const retainFactor = 10_000 - reserveFactorBps;
  return Math.floor((grossSupplyBps * retainFactor) / 10_000);
}

/**
 * Calculate maximum borrowing capacity in USD given collateral value and max LTV.
 */
export function calculateBorrowCapacity(
  collateralValueUsd: bigint,
  maxLtvBps: number
): bigint {
  return applyBps(collateralValueUsd, maxLtvBps);
}

/**
 * Calculate Position Health Factor.
 * HF = (Collateral Value * Liquidation Threshold) / Total Debt
 * Returns basis points (10000 = 1.0) and formatted health object.
 */
export function calculateHealthFactor(
  collateralValueUsd: bigint,
  totalDebtUsd: bigint,
  liquidationThresholdBps: number
): HealthFactor {
  if (collateralValueUsd < 0n || totalDebtUsd < 0n) throw new Error('Negative value in calculateHealthFactor');
  if (!Number.isSafeInteger(liquidationThresholdBps) || liquidationThresholdBps < 0) {
    throw new Error('Invalid liquidation threshold');
  }
  if (totalDebtUsd === 0n) {
    return {
      score: Infinity,
      basisPoints: 999_999,
      status: 'infinite',
    };
  }

  if (collateralValueUsd === 0n) {
    return {
      score: 0,
      basisPoints: 0,
      status: 'liquidatable',
    };
  }

  const liquidationValue = applyBps(collateralValueUsd, liquidationThresholdBps);
  const hfBpsRaw = (liquidationValue * BPS_DIVISOR) / totalDebtUsd;
  const hfBps = hfBpsRaw > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(hfBpsRaw);
  const score = hfBps / 10_000;

  let status: HealthFactor['status'] = 'safe';
  if (hfBps < 10_000) {
    status = 'liquidatable';
  } else if (hfBps < 12_000) {
    status = 'danger';
  } else if (hfBps < 15_000) {
    status = 'warning';
  }

  return {
    score,
    basisPoints: hfBps,
    status,
  };
}

/**
 * Calculate seized collateral and liquidation bonus given repay amount and collateral price.
 */
export function calculateLiquidationAmounts(
  repayDebtAmount: bigint,
  borrowPriceUsd: bigint,
  collateralPriceUsd: bigint,
  liquidationBonusBps: number,
  borrowDecimals: number,
  collateralDecimals: number
): { seizedCollateralAmount: bigint; bonusCollateralAmount: bigint } {
  if (repayDebtAmount < 0n || borrowPriceUsd < 0n || collateralPriceUsd <= 0n) {
    throw new Error('Invalid liquidation amount or price');
  }
  if (!Number.isSafeInteger(liquidationBonusBps) || liquidationBonusBps < 0) {
    throw new Error('Invalid liquidation bonus');
  }
  if (![borrowDecimals, collateralDecimals].every((value) => Number.isSafeInteger(value) && value >= 0 && value <= 255)) {
    throw new Error('Invalid token decimals');
  }
  const borrowUnit = 10n ** BigInt(borrowDecimals);
  const collateralUnit = 10n ** BigInt(collateralDecimals);

  // Repay value in standard USD (1e9)
  const repayValueUsd = mulDivDown(repayDebtAmount, borrowPriceUsd, borrowUnit);

  // Total value with bonus
  const totalValueWithBonus = applyBps(repayValueUsd, 10_000 + liquidationBonusBps);
  const bonusOnlyValue = applyBps(repayValueUsd, liquidationBonusBps);

  const seizedCollateralAmount = mulDivDown(totalValueWithBonus, collateralUnit, collateralPriceUsd);
  const bonusCollateralAmount = mulDivDown(bonusOnlyValue, collateralUnit, collateralPriceUsd);

  return {
    seizedCollateralAmount,
    bonusCollateralAmount,
  };
}
