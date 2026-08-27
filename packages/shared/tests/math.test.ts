import { describe, expect, it } from 'vitest';
import {
  calculateBorrowCapacity,
  calculateBorrowRate,
  calculateHealthFactor,
  calculateLiquidationAmounts,
  calculateSupplyRate,
  calculateUtilization,
  mulDivDown,
  tokenAmountToUsd,
} from '../src/index.js';

describe('Fixed Point & Lending Math', () => {
  it('calculates pool utilization correctly', () => {
    // 400 borrowed / 1000 supplied = 40% (4000 bps)
    const util = calculateUtilization(400_000_0000000n, 1000_000_0000000n);
    expect(util).toBe(4000);

    // 0 supply = 0%
    expect(calculateUtilization(0n, 0n)).toBe(0);

    // 100% cap
    expect(calculateUtilization(1200n, 1000n)).toBe(10_000);
  });

  it('calculates kinked borrow rates properly', () => {
    const config = {
      baseRateBps: 200, // 2%
      optimalUtilizationBps: 8000, // 80%
      slope1Bps: 500, // 5%
      slope2Bps: 5000, // 50%
    };

    // At 0% utilization -> 2% (200 bps)
    expect(calculateBorrowRate(0, config)).toBe(200);

    // At 40% utilization (halfway) -> 2% + 2.5% = 4.5% (450 bps)
    expect(calculateBorrowRate(4000, config)).toBe(450);

    // At 80% optimal utilization -> 2% + 5% = 7% (700 bps)
    expect(calculateBorrowRate(8000, config)).toBe(700);

    // At 90% utilization -> 2% + 5% + 0.5 * 50% = 32% (3200 bps)
    expect(calculateBorrowRate(9000, config)).toBe(3200);
  });

  it('calculates supply rate with reserve factor', () => {
    // Borrow rate 700 bps (7%), utilization 8000 bps (80%), reserve factor 1000 bps (10%)
    // Gross = 7% * 80% = 5.6% (560 bps)
    // Net = 5.6% * (1 - 10%) = 5.04% (504 bps)
    const supplyRate = calculateSupplyRate(700, 8000, 1000);
    expect(supplyRate).toBe(504);
  });

  it('evaluates health factors accurately', () => {
    // Collateral: $1000, Liquidation Threshold: 80% (8000 bps), Total Debt: $500
    // Liquidation value = $800, HF = 800 / 500 = 1.6 (16000 bps, safe)
    const hfSafe = calculateHealthFactor(
      1000_000_000_000n, // $1000
      500_000_000_000n,  // $500
      8000
    );
    expect(hfSafe.basisPoints).toBe(16000);
    expect(hfSafe.score).toBe(1.6);
    expect(hfSafe.status).toBe('safe');

    // Total Debt: $900 -> Liquidation value $800 / $900 = 0.8888 (liquidatable)
    const hfUnsafe = calculateHealthFactor(
      1000_000_000_000n,
      900_000_000_000n,
      8000
    );
    expect(hfUnsafe.status).toBe('liquidatable');
    expect(hfUnsafe.basisPoints).toBeLessThan(10_000);
  });

  it('calculates liquidation seized collateral and bonus amounts', () => {
    // Repay $100 USDC (7 decimals = 1_000_000_000 stroops), USDC Price = $1.00 (1e9)
    // XLM Price = $0.10 (100_000_000 in 1e9 scale)
    // Liquidation Bonus = 5% (500 bps)
    // Expected total seized value = $105 USDC => 1050 XLM
    const { seizedCollateralAmount, bonusCollateralAmount } = calculateLiquidationAmounts(
      100_0000000n,
      1_000_000_000n,
      100_000_000n,
      500,
      7,
      7
    );

    expect(seizedCollateralAmount).toBe(1050_0000000n);
    expect(bonusCollateralAmount).toBe(50_0000000n);
  });
});
