import { repository } from '../db/repository.js';
import { logger } from '../utils/logger.js';
import { positionService } from './position.service.js';

export class EventProcessorService {
  async processEvent(rawEvent: any): Promise<void> {
    try {
      logger.info(`Processing raw contract event: ${rawEvent.id || 'unknown'}`);
      // Parse Soroban contract event topics and data
      // Track supply, withdraw, borrow, repay, deposit_collateral, withdraw_collateral, liquidate
    } catch (err: any) {
      logger.error(`Failed to process event: ${err.message}`);
    }
  }
}

export const eventProcessorService = new EventProcessorService();
