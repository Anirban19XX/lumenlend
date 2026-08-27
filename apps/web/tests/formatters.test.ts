import { describe, expect, it } from 'vitest';
import { formatBps, formatTokenAmount, formatUsd, truncateAddress } from '../lib/formatters.js';

describe('Web Formatters', () => {
  it('formats USD values accurately', () => {
    // $1,250 USD in 1e9 scale
    const formatted = formatUsd(1250_000_000_000n);
    expect(formatted).toBe('$1,250.00');
  });

  it('formats token amounts with stroops', () => {
    // 500 XLM with 7 decimals
    const formatted = formatTokenAmount(500_0000000n, 7);
    expect(formatted).toBe('500.00');
  });

  it('formats basis points to percentage strings', () => {
    expect(formatBps(7500)).toBe('75.00%');
    expect(formatBps(450)).toBe('4.50%');
  });

  it('truncates Stellar account addresses correctly', () => {
    const address = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    expect(truncateAddress(address, 4, 4)).toBe('GBBD...FLA5');
  });
});
