import type { Market, UserPosition } from '@lumenlend/shared';
import { db } from './connection.js';

export class ProtocolRepository {
  // In-memory fallback for local dev when Postgres is not running
  private static memoryMarkets: Map<string, any> = new Map();
  private static memoryPositions: Map<string, any> = new Map();
  private static memoryEvents: any[] = [];

  async getMarket(marketId: string): Promise<any | null> {
    try {
      const res = await db.query('SELECT * FROM markets WHERE market_id = $1', [marketId]);
      return res.rows[0] || ProtocolRepository.memoryMarkets.get(marketId) || null;
    } catch {
      return ProtocolRepository.memoryMarkets.get(marketId) || null;
    }
  }

  async getAllMarkets(): Promise<any[]> {
    try {
      const res = await db.query('SELECT * FROM markets');
      return res.rows.length > 0 ? res.rows : Array.from(ProtocolRepository.memoryMarkets.values());
    } catch {
      return Array.from(ProtocolRepository.memoryMarkets.values());
    }
  }

  async saveMarket(market: any): Promise<void> {
    ProtocolRepository.memoryMarkets.set(market.market_id, market);
    try {
      await db.query(
        `INSERT INTO markets (
          market_id, collateral_asset_id, borrow_asset_id, total_supplied, total_borrowed,
          total_reserves, borrow_index, supply_apy_bps, borrow_apy_bps, utilization_bps,
          collateral_price_usd, borrow_price_usd, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT (market_id) DO UPDATE SET
          total_supplied = EXCLUDED.total_supplied,
          total_borrowed = EXCLUDED.total_borrowed,
          total_reserves = EXCLUDED.total_reserves,
          borrow_index = EXCLUDED.borrow_index,
          supply_apy_bps = EXCLUDED.supply_apy_bps,
          borrow_apy_bps = EXCLUDED.borrow_apy_bps,
          utilization_bps = EXCLUDED.utilization_bps,
          collateral_price_usd = EXCLUDED.collateral_price_usd,
          borrow_price_usd = EXCLUDED.borrow_price_usd,
          updated_at = NOW()`,
        [
          market.market_id,
          market.collateral_asset_id,
          market.borrow_asset_id,
          market.total_supplied.toString(),
          market.total_borrowed.toString(),
          market.total_reserves.toString(),
          market.borrow_index.toString(),
          market.supply_apy_bps,
          market.borrow_apy_bps,
          market.utilization_bps,
          market.collateral_price_usd.toString(),
          market.borrow_price_usd.toString(),
        ]
      );
    } catch {
      // Memory fallback active
    }
  }

  async getUserPosition(userAddress: string, marketId: string): Promise<any | null> {
    const key = `${userAddress}:${marketId}`;
    try {
      const res = await db.query(
        'SELECT * FROM positions WHERE user_address = $1 AND market_id = $2',
        [userAddress, marketId]
      );
      return res.rows[0] || ProtocolRepository.memoryPositions.get(key) || null;
    } catch {
      return ProtocolRepository.memoryPositions.get(key) || null;
    }
  }

  async saveUserPosition(position: any): Promise<void> {
    const key = `${position.user_address}:${position.market_id}`;
    ProtocolRepository.memoryPositions.set(key, position);
    try {
      await db.query(
        `INSERT INTO positions (
          user_address, market_id, supplied_amount, borrowed_amount,
          collateral_amount, health_factor_bps, is_liquidatable, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (user_address, market_id) DO UPDATE SET
          supplied_amount = EXCLUDED.supplied_amount,
          borrowed_amount = EXCLUDED.borrowed_amount,
          collateral_amount = EXCLUDED.collateral_amount,
          health_factor_bps = EXCLUDED.health_factor_bps,
          is_liquidatable = EXCLUDED.is_liquidatable,
          updated_at = NOW()`,
        [
          position.user_address,
          position.market_id,
          position.supplied_amount.toString(),
          position.borrowed_amount.toString(),
          position.collateral_amount.toString(),
          position.health_factor_bps,
          position.is_liquidatable,
        ]
      );
    } catch {
      // Memory fallback active
    }
  }

  async getLiquidatablePositions(): Promise<any[]> {
    try {
      const res = await db.query('SELECT * FROM positions WHERE is_liquidatable = TRUE');
      return res.rows.length > 0
        ? res.rows
        : Array.from(ProtocolRepository.memoryPositions.values()).filter((p) => p.is_liquidatable);
    } catch {
      return Array.from(ProtocolRepository.memoryPositions.values()).filter((p) => p.is_liquidatable);
    }
  }

  async insertEvent(event: any): Promise<void> {
    ProtocolRepository.memoryEvents.unshift(event);
    if (ProtocolRepository.memoryEvents.length > 1000) {
      ProtocolRepository.memoryEvents.pop();
    }
    try {
      await db.query(
        `INSERT INTO events (id, transaction_hash, event_type, user_address, market_id, amount, ledger_sequence, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          event.id,
          event.transaction_hash,
          event.event_type,
          event.user_address,
          event.market_id,
          event.amount.toString(),
          event.ledger_sequence,
        ]
      );
    } catch {
      // Memory fallback active
    }
  }

  async getRecentEvents(limit: number = 20): Promise<any[]> {
    try {
      const res = await db.query('SELECT * FROM events ORDER BY created_at DESC LIMIT $1', [limit]);
      return res.rows.length > 0 ? res.rows : ProtocolRepository.memoryEvents.slice(0, limit);
    } catch {
      return ProtocolRepository.memoryEvents.slice(0, limit);
    }
  }
}

export const repository = new ProtocolRepository();
