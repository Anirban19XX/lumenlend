'use client';

import React from 'react';
import { Card, Badge, Button } from '@lumenlend/ui';
import { useLumenLend } from '../../providers/LumenLendProvider';
import { formatBps, formatTokenAmount, formatUsd } from '../../lib/formatters';

interface MarketCardProps {
  onSupplyClick: () => void;
  onBorrowClick: () => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  onSupplyClick,
  onBorrowClick,
}) => {
  const { market } = useLumenLend();
  const utilPercent = market.state.utilizationBps / 100;

  return (
    <Card variant="glass" padding="lg" className="border-slate-800/90 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3 items-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border-2 border-slate-900 flex items-center justify-center text-cyan-400 font-extrabold text-lg shadow-lg">
              XLM
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border-2 border-slate-900 flex items-center justify-center text-blue-400 font-extrabold text-lg shadow-lg">
              USDC
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white tracking-tight">XLM / USDC Market</h3>
              <Badge variant="safe">Active</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Supply USDC liquidity &amp; borrow USDC against XLM collateral</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onSupplyClick} variant="secondary" size="md">
            Supply USDC
          </Button>
          <Button onClick={onBorrowClick} variant="primary" size="md">
            Borrow USDC
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-slate-800/80">
        <div>
          <span className="text-xs text-slate-400 font-medium">Supply APY</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {formatBps(market.state.supplyApyBps)}
          </div>
          <span className="text-[11px] text-slate-500">Variable rate</span>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">Borrow APY</span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {formatBps(market.state.borrowApyBps)}
          </div>
          <span className="text-[11px] text-slate-500">Kinked rate model</span>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">Total Supplied</span>
          <div className="text-2xl font-black text-white mt-1">
            {formatTokenAmount(market.state.totalSupply, 7, 0)} <span className="text-xs font-bold text-slate-400">USDC</span>
          </div>
          <span className="text-[11px] text-slate-500">Available liquidity</span>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">Total Borrowed</span>
          <div className="text-2xl font-black text-white mt-1">
            {formatTokenAmount(market.state.totalBorrowed, 7, 0)} <span className="text-xs font-bold text-slate-400">USDC</span>
          </div>
          <span className="text-[11px] text-slate-500">Active loans</span>
        </div>
      </div>

      {/* Utilization & Risk Parameters */}
      <div className="pt-6 space-y-4">
        <div>
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400 font-medium">Pool Utilization Rate</span>
            <span className="text-white font-extrabold">{utilPercent.toFixed(2)}% / Optimal 80%</span>
          </div>
          <div className="w-full bg-slate-800/90 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilPercent > 80
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${Math.min(100, utilPercent)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Max LTV</span>
            <span className="font-bold text-slate-200">{formatBps(market.config.maxLtvBps)}</span>
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Liquidation Threshold</span>
            <span className="font-bold text-slate-200">{formatBps(market.config.liquidationThresholdBps)}</span>
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Liquidation Bonus</span>
            <span className="font-bold text-slate-200">{formatBps(market.config.liquidationBonusBps)}</span>
          </div>
          <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
            <span className="text-slate-500 block text-[11px]">Reserve Factor</span>
            <span className="font-bold text-slate-200">{formatBps(market.config.reserveFactorBps)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
