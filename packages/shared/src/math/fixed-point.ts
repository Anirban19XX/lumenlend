import { BPS_DIVISOR, PRICE_PRECISION } from '../constants/index.js';

/**
 * Multiply two numbers and divide by scaling base with rounding down.
 */
export function mulDivDown(a: bigint, b: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error('Zero division in mulDivDown');
  return (a * b) / denominator;
}

/**
 * Multiply two numbers and divide by scaling base with rounding up.
 */
export function mulDivUp(a: bigint, b: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error('Zero division in mulDivUp');
  if (a === 0n || b === 0n) return 0n;
  return (a * b + (denominator - 1n)) / denominator;
}

/**
 * Scale token amount (with sourceDecimals) to standard 9-decimal USD value.
 */
export function tokenAmountToUsd(
  tokenAmount: bigint,
  tokenDecimals: number,
  priceUsd: bigint // scaled by 1e9
): bigint {
  const tokenUnit = 10n ** BigInt(tokenDecimals);
  // (tokenAmount * priceUsd) / tokenUnit => USD amount with 9 decimals
  return mulDivDown(tokenAmount, priceUsd, tokenUnit);
}

/**
 * Scale standard 9-decimal USD value back to token amount.
 */
export function usdToTokenAmount(
  usdAmount: bigint,
  tokenDecimals: number,
  priceUsd: bigint // scaled by 1e9
): bigint {
  if (priceUsd === 0n) throw new Error('Invalid zero price in usdToTokenAmount');
  const tokenUnit = 10n ** BigInt(tokenDecimals);
  // (usdAmount * tokenUnit) / priceUsd
  return mulDivDown(usdAmount, tokenUnit, priceUsd);
}

/**
 * Convert basis points (e.g. 7500) to fraction of an amount.
 */
export function applyBps(amount: bigint, bps: number): bigint {
  return mulDivDown(amount, BigInt(bps), BPS_DIVISOR);
}
