import { logger } from '../utils/logger.js';

export class InterestWorker {
  private timer: NodeJS.Timeout | null = null;

  start(intervalMs: number = 60_000): void {
    logger.info('Starting interest accrual monitor worker...');
    this.timer = setInterval(async () => {
      try {
        await this.runTick();
      } catch (err: any) {
        logger.error(`Interest worker tick error: ${err.message}`);
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
    logger.debug('Interest worker: evaluating time-based interest indexes.');
  }
}

export const interestWorker = new InterestWorker();
