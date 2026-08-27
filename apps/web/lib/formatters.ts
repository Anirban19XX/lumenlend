/**
 * Currency, token and percentage formatting helpers.
 */

export function formatUsd(amountBigInt: bigint, decimals: number = 2): string {
  // Amount is scaled by 1e9 (USD standard precision)
  const num = Number(amountBigInt) / 1_000_000_000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatTokenAmount(amountBigInt: bigint, tokenDecimals: number = 7, displayDecimals: number = 2): string {
  const divisor = 10 ** tokenDecimals;
  const num = Number(amountBigInt) / divisor;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: displayDecimals,
    maximumFractionDigits: displayDecimals,
  }).format(num);
}

export function formatBps(bps: number, decimals: number = 2): string {
  const percentage = bps / 100;
  return `${percentage.toFixed(decimals)}%`;
}

export function truncateAddress(address: string, start: number = 4, end: number = 4): string {
  if (!address) return '';
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}
