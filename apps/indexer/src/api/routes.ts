import { Router, type IRouter } from 'express';
import { apiController } from './controllers.js';

export const apiRouter: IRouter = Router();

apiRouter.get('/markets', (req, res) => apiController.getMarkets(req, res));
apiRouter.get('/markets/:marketId', (req, res) => apiController.getMarketById(req, res));
apiRouter.get('/positions/:userAddress', (req, res) => apiController.getUserPosition(req, res));
apiRouter.get('/liquidatable', (req, res) => apiController.getLiquidatablePositions(req, res));
apiRouter.get('/stats', (req, res) => apiController.getProtocolStats(req, res));
apiRouter.get('/activity', (req, res) => apiController.getRecentActivity(req, res));
