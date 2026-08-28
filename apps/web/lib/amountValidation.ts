export const TOKEN_DECIMALS = 7;

export interface AmountValidation {
  amount: bigint | null;
  error: string | null;
}

export function parseTokenAmount(value: string, decimals: number = TOKEN_DECIMALS): AmountValidation {
  const trimmed = value.trim();
  if (!trimmed) return { amount: null, error: 'Enter an amount.' };
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return { amount: null, error: 'Enter a valid positive number.' };
  }

  const [whole, fraction = ''] = trimmed.split('.');
  if (fraction.length > decimals) {
    return { amount: null, error: `Amount cannot have more than ${decimals} decimal places.` };
  }

  const amount = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
  if (amount <= 0n) return { amount: null, error: 'Amount must be greater than zero.' };
  return { amount, error: null };
}

export function validateAvailableAmount(amount: bigint, available: bigint, label: string): string | null {
  return amount > available ? `Insufficient ${label}. Available: ${available.toString()} base units.` : null;
}