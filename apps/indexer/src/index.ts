import cors from 'cors';
import express from 'express';
import { apiRouter } from './api/routes.js';
import { config } from './config/environment.js';
import { db } from './db/connection.js';
import { eventPoller } from './listeners/event-poller.js';
import { eventProcessorService } from './services/event-processor.service.js';
import { logger } from './utils/logger.js';
import { interestWorker } from './workers/interest-worker.js';
import { liquidationWorker } from './workers/liquidation-worker.js';

async function bootstrap() {
  logger.info('======================================================');
  logger.info('🚀 Starting LumenLend Protocol Indexer & API Service...');
  logger.info('======================================================');
  logger.info(`Network: ${config.stellarNetwork}`);
  logger.info(`RPC URL: ${config.rpcUrl}`);
  logger.info(`Port: ${config.port}`);

  // 1. Initialize Database Schema
  await db.init();

  // 2. Setup Event Listener
  eventPoller.onEvent(async (evt) => {
    await eventProcessorService.processEvent(evt);
  });
  await eventPoller.start();

  // 3. Start Background Workers
  interestWorker.start();
  liquidationWorker.start();

  // 4. Start HTTP REST API
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_, res) => {
    res.json({ status: 'ok', network: config.stellarNetwork, timestamp: Date.now() });
  });

  app.use('/api/v1', apiRouter);

  app.listen(config.port, () => {
    logger.info(`✅ LumenLend REST API running on http://localhost:${config.port}/api/v1`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error:', err);
  process.exit(1);
});
