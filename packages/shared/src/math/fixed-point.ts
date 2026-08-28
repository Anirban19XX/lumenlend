import { BPS_DIVISOR, PRICE_PRECISION } from '../constants/index.js';

const MAX_TOKEN_DECIMALS = 255;

function validateTokenDecimals(tokenDecimals: number): void {
  if (!Number.isSafeInteger(tokenDecimals) || tokenDecimals < 0 || tokenDecimals > MAX_TOKEN_DECIMALS) {
    throw new Error('Invalid token decimals');
  }
}

/**
 * Multiply two numbers and divide by scaling base with rounding down.
 */
export function mulDivDown(a: bigint, b: bigint, denominator: bigint): bigint {
  if (a < 0n || b < 0n) throw new Error('Negative value in mulDivDown');
  if (denominator <= 0n) throw new Error('Invalid denominator in mulDivDown');
  return (a * b) / denominator;
}

/**
 * Multiply two numbers and divide by scaling base with rounding up.
 */
export function mulDivUp(a: bigint, b: bigint, denominator: bigint): bigint {
  if (a < 0n || b < 0n) throw new Error('Negative value in mulDivUp');
  if (denominator <= 0n) throw new Error('Invalid denominator in mulDivUp');
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
  validateTokenDecimals(tokenDecimals);
  if (tokenAmount < 0n || priceUsd < 0n) throw new Error('Negative value in tokenAmountToUsd');
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
  validateTokenDecimals(tokenDecimals);
  if (usdAmount < 0n || priceUsd < 0n) throw new Error('Negative value in usdToTokenAmount');
  const tokenUnit = 10n ** BigInt(tokenDecimals);
  // (usdAmount * tokenUnit) / priceUsd
  return mulDivDown(usdAmount, tokenUnit, priceUsd);
}

/**
 * Convert basis points (e.g. 7500) to fraction of an amount.
 */
export function applyBps(amount: bigint, bps: number): bigint {
  if (amount < 0n) throw new Error('Negative amount in applyBps');
  if (!Number.isSafeInteger(bps) || bps < 0) throw new Error('Invalid basis points in applyBps');
  return mulDivDown(amount, BigInt(bps), BPS_DIVISOR);
}
