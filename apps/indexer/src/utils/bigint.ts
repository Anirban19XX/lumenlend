/**
 * JSON serialization helper for BigInt values.
 */
export function serializeBigInt<T>(data: T): any {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}
