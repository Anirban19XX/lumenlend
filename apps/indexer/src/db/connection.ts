import pg from 'pg';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { DB_SCHEMA_SQL } from './schema.js';

const { Pool } = pg;

export class Database {
  private pool: pg.Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.databaseUrl,
    });
  }

  async init(): Promise<void> {
    try {
      logger.info('Initializing database schema...');
      await this.pool.query(DB_SCHEMA_SQL);
      logger.info('Database schema initialized successfully.');
    } catch (err: any) {
      logger.warn(`Database connection/schema init warning: ${err.message}. Proceeding in mock-memory fallback mode if offline.`);
    }
  }

  async query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new Database();
