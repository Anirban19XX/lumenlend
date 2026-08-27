import { db } from '../db/connection.js';

export class CursorTracker {
  private static memoryCursors: Map<string, { pagingToken: string; ledger: number }> = new Map();

  async getCursor(contractId: string): Promise<{ pagingToken?: string; ledger: number }> {
    try {
      const res = await db.query('SELECT last_paging_token, last_ledger FROM indexer_cursors WHERE contract_id = $1', [
        contractId,
      ]);
      if (res.rows.length > 0) {
        return {
          pagingToken: res.rows[0].last_paging_token || undefined,
          ledger: Number(res.rows[0].last_ledger || 0),
        };
      }
    } catch {
      // fallback
    }
    return CursorTracker.memoryCursors.get(contractId) || { ledger: 0 };
  }

  async saveCursor(contractId: string, pagingToken: string, ledger: number): Promise<void> {
    CursorTracker.memoryCursors.set(contractId, { pagingToken, ledger });
    try {
      await db.query(
        `INSERT INTO indexer_cursors (contract_id, last_paging_token, last_ledger, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (contract_id) DO UPDATE SET
           last_paging_token = EXCLUDED.last_paging_token,
           last_ledger = EXCLUDED.last_ledger,
           updated_at = NOW()`,
        [contractId, pagingToken, ledger]
      );
    } catch {
      // fallback
    }
  }
}

export const cursorTracker = new CursorTracker();
