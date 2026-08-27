import type { Request, Response } from 'express';
import { repository } from '../db/repository.js';
import { marketService } from '../services/market.service.js';
import { positionService } from '../services/position.service.js';
import { serializeBigInt } from '../utils/bigint.js';

export class ApiController {
  async getMarkets(req: Request, res: Response): Promise<void> {
    try {
      const market = await marketService.getMarket();
      res.json({ success: true, data: [serializeBigInt(market)] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getMarketById(req: Request, res: Response): Promise<void> {
    try {
      const marketId = Array.isArray(req.params.marketId) ? req.params.marketId[0] : req.params.marketId;
      const market = await marketService.getMarket(marketId);
      res.json({ success: true, data: serializeBigInt(market) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getUserPosition(req: Request, res: Response): Promise<void> {
    try {
      const userAddress = (Array.isArray(req.params.userAddress) ? req.params.userAddress[0] : req.params.userAddress) || '';
      const marketId = (req.query.marketId as string) || 'XLM-USDC-V1';
      const position = await positionService.getPosition(userAddress, marketId);
      res.json({ success: true, data: serializeBigInt(position) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getLiquidatablePositions(req: Request, res: Response): Promise<void> {
    try {
      const positions = await repository.getLiquidatablePositions();
      res.json({ success: true, data: serializeBigInt(positions) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getProtocolStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await marketService.getProtocolStats();
      res.json({ success: true, data: serializeBigInt(stats) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 20;
      const events = await repository.getRecentEvents(limit);
      res.json({ success: true, data: serializeBigInt(events) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const apiController = new ApiController();
