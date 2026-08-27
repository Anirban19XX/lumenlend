import { describe, expect, it } from 'vitest';
import {
  calculateBorrowCapacity,
  calculateHealthFactor,
  calculateLiquidationAmounts,
  DEFAULT_XLM_USDC_MARKET_CONFIG,
  tokenAmountToUsd,
} from '@lumenlend/shared';

describe('Integration: Complete XLM Collateral → USDC Borrow → Liquidation Lifecycle', () => {
  it('executes full lending, borrowing, price-drop, and liquidation math pipeline', () => {
    // 1. Initial Market State: XLM = $0.12 (120_000_000 in 1e9), USDC = $1.00 (1_000_000_000 in 1e9)
    let xlmPriceUsd = 120_000_000n;
    const usdcPriceUsd = 1_000_000_000n;

    // 2. Liquidity Supplier deposits 10,000 USDC
    const suppliedUsdc = 10_000_0000000n;
    expect(suppliedUsdc).toBeGreaterThan(0n);

    // 3. Borrower deposits 10,000 XLM collateral
    const collateralXlm = 10_000_0000000n;
    const collateralValueUsd = tokenAmountToUsd(collateralXlm, 7, xlmPriceUsd); // $1,200 USD
    expect(collateralValueUsd).toBe(1200_000_000_000n);

    // 4. Calculate Max Borrow Capacity (75% LTV)
    const maxBorrowCapacity = calculateBorrowCapacity(
      collateralValueUsd,
      DEFAULT_XLM_USDC_MARKET_CONFIG.maxLtvBps
    );
    expect(maxBorrowCapacity).toBe(900_000_000_000n); // $900 USD

    // 5. Borrower borrows 600 USDC
    const borrowedUsdc = 600_0000000n;
    const borrowedDebtUsd = tokenAmountToUsd(borrowedUsdc, 7, usdcPriceUsd); // $600 USD

    // Initial Health Factor = ($1200 * 80%) / $600 = $960 / $600 = 1.60
    const initialHf = calculateHealthFactor(
      collateralValueUsd,
      borrowedDebtUsd,
      DEFAULT_XLM_USDC_MARKET_CONFIG.liquidationThresholdBps
    );
    expect(initialHf.status).toBe('safe');
    expect(initialHf.score).toBe(1.6);

    // 6. Interest Accrues over time: Debt increases from 600 USDC to 650 USDC
    const debtWithInterest = 650_0000000n;
    const debtWithInterestUsd = tokenAmountToUsd(debtWithInterest, 7, usdcPriceUsd);

    // 7. Market Shock: XLM Price drops by 40% from $0.12 to $0.072 (72_000_000 in 1e9)
    xlmPriceUsd = 72_000_000n;
    const newCollateralValueUsd = tokenAmountToUsd(collateralXlm, 7, xlmPriceUsd); // $720 USD

    // Health Factor after price drop:
    // Liquidation value = $720 * 80% = $576 USD
    // Debt = $650 USD => HF = $576 / $650 ≈ 0.886 (< 1.0 -> Liquidatable!)
    const stressedHf = calculateHealthFactor(
      newCollateralValueUsd,
      debtWithInterestUsd,
      DEFAULT_XLM_USDC_MARKET_CONFIG.liquidationThresholdBps
    );
    expect(stressedHf.status).toBe('liquidatable');
    expect(stressedHf.score).toBeLessThan(1.0);

    // 8. Liquidator intervenes and repays 300 USDC (50% of the loan close factor)
    const repayAmountUsdc = 300_0000000n;
    const { seizedCollateralAmount, bonusCollateralAmount } = calculateLiquidationAmounts(
      repayAmountUsdc,
      usdcPriceUsd,
      xlmPriceUsd,
      DEFAULT_XLM_USDC_MARKET_CONFIG.liquidationBonusBps, // 5% bonus
      7,
      7
    );

    // Seized value: $300 * 1.05 = $315 USD worth of XLM at $0.072 per XLM
    // $315 / $0.072 = 4,375 XLM
    expect(seizedCollateralAmount).toBe(4375_0000000n);
    expect(bonusCollateralAmount).toBe(208_3333333n); // ~208.33 XLM bonus profit to liquidator

    // 9. Remaining loan state verification
    const remainingDebt = debtWithInterest - repayAmountUsdc; // 350 USDC
    const remainingCollateral = collateralXlm - seizedCollateralAmount; // 5,625 XLM = $405 USD
    const postLiqCollateralUsd = tokenAmountToUsd(remainingCollateral, 7, xlmPriceUsd);
    const postLiqDebtUsd = tokenAmountToUsd(remainingDebt, 7, usdcPriceUsd);

    const restoredHf = calculateHealthFactor(
      postLiqCollateralUsd,
      postLiqDebtUsd,
      DEFAULT_XLM_USDC_MARKET_CONFIG.liquidationThresholdBps
    );

    // Health Factor restored above 0.92
    expect(restoredHf.score).toBeGreaterThan(stressedHf.score);
  });
});
