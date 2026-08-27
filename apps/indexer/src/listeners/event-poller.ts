import { StellarRpcClient } from '@lumenlend/stellar';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { cursorTracker } from './cursor-tracker.js';

export type EventHandler = (event: any) => Promise<void>;

export class EventPoller {
  private rpcClient: StellarRpcClient;
  private isRunning: boolean = false;
  private handlers: EventHandler[] = [];

  constructor() {
    this.rpcClient = new StellarRpcClient(config.stellarNetwork, config.rpcUrl);
  }

  onEvent(handler: EventHandler) {
    this.handlers.push(handler);
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(`Starting Soroban event listener with poll interval ${config.pollIntervalMs}ms...`);

    const poll = async () => {
      if (!this.isRunning) return;
      try {
        await this.pollOnce();
      } catch (err: any) {
        logger.debug(`Polling tick note: ${err.message}`);
      } finally {
        if (this.isRunning) {
          setTimeout(poll, config.pollIntervalMs);
        }
      }
    };

    poll();
  }

  stop(): void {
    this.isRunning = false;
    logger.info('Stopped Soroban event listener.');
  }

  async pollOnce(): Promise<void> {
    if (!config.contracts.lendingPool) {
      return;
    }

    try {
      const latestLedgerRes = await this.rpcClient.getLatestLedger();
      const cursor = await cursorTracker.getCursor(config.contracts.lendingPool);
      const startLedger = cursor.ledger > 0 ? cursor.ledger + 1 : Math.max(1, latestLedgerRes.sequence - 100);

      const eventsRes = await this.rpcClient.getEvents({
        startLedger,
        filters: [
          {
            type: 'contract',
            contractIds: [
              config.contracts.lendingPool,
              config.contracts.collateralVault,
              config.contracts.liquidationEngine,
            ].filter(Boolean),
          },
        ],
      });

      if (eventsRes && eventsRes.events) {
        for (const evt of eventsRes.events) {
          for (const handler of this.handlers) {
            await handler(evt);
          }
        }
        if (eventsRes.latestLedger) {
          await cursorTracker.saveCursor(
            config.contracts.lendingPool,
            eventsRes.cursor || '',
            eventsRes.latestLedger
          );
        }
      }
    } catch (err: any) {
      // RPC or network connection error
      logger.debug(`Soroban RPC poll notice: ${err.message}`);
    }
  }
}

export const eventPoller = new EventPoller();
