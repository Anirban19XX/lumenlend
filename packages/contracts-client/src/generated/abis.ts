/**
 * Generated Soroban Contract Interface Specifications
 */

export const LENDING_POOL_SPEC = [
  'initialize',
  'init_market',
  'supply',
  'withdraw',
  'borrow',
  'repay',
  'get_market_state',
  'get_user_position',
] as const;

export const COLLATERAL_VAULT_SPEC = [
  'initialize',
  'deposit_collateral',
  'withdraw_collateral',
  'get_collateral',
  'get_health_factor',
] as const;

export const LIQUIDATION_ENGINE_SPEC = [
  'initialize',
  'is_liquidatable',
  'liquidate',
] as const;

export const ORACLE_MANAGER_SPEC = [
  'initialize',
  'set_price',
  'get_price',
  'get_price_with_timestamp',
] as const;

export const INTEREST_RATE_MODEL_SPEC = [
  'initialize',
  'get_utilization',
  'get_borrow_rate',
  'get_supply_rate',
] as const;
