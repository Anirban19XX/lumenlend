import { repository } from '../db/repository.js';
import { logger } from '../utils/logger.js';

export class LiquidationWorker {
  private timer: NodeJS.Timeout | null = null;

  start(intervalMs: number = 30_000): void {
    logger.info('Starting liquidatable position monitor worker...');
    this.timer = setInterval(async () => {
      try {
        await this.runTick();
      } catch (err: any) {
        logger.error(`Liquidation worker tick error: ${err.message}`);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runTick(): Promise<void> {
    const liquidatables = await repository.getLiquidatablePositions();
    if (liquidatables.length > 0) {
      logger.warn(`Found ${liquidatables.length} positions eligible for liquidation!`);
    }
  }
}

export const liquidationWorker = new LiquidationWorker();
