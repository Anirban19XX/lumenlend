'use client';

import React from 'react';
import { Card, HealthGauge, Badge, Button } from '@lumenlend/ui';
import { useLumenLend } from '../../providers/LumenLendProvider';
import { useWallet } from '../../providers/WalletProvider';
import { formatBps, formatTokenAmount, formatUsd } from '../../lib/formatters';

interface PositionSummaryProps {
  onOpenSupply: () => void;
  onOpenBorrow: () => void;
}

export const PositionSummary: React.FC<PositionSummaryProps> = ({
  onOpenSupply,
  onOpenBorrow,
}) => {
  const { isConnected, connect } = useWallet();
  const { userPosition, market } = useLumenLend();

  if (!isConnected || !userPosition) {
    return (
      <Card variant="glass" padding="lg" className="text-center py-12">
        <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Connect Your Stellar Wallet</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Connect your Freighter wallet to view your collateral, borrowing capacity, and active loan positions.
        </p>
        <Button onClick={connect} variant="primary" size="md">
          Connect Wallet
        </Button>
      </Card>
    );
  }

  const hfScore = userPosition.borrowedAmount > 0n
    ? userPosition.healthFactorBps / 10_000
    : Infinity;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Collateral & Borrow Capacity */}
      <Card variant="glass" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Locked Collateral</span>
          <Badge variant="info">XLM</Badge>
        </div>

        <div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatTokenAmount(userPosition.collateralAmount, 7)} <span className="text-sm font-semibold text-slate-400">XLM</span>
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-1">
            ≈ {formatUsd(userPosition.collateralValueUsd)} USD
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Max Borrow Capacity:</span>
            <span className="font-semibold text-slate-200">{formatUsd(userPosition.borrowCapacityUsd)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Available to Borrow:</span>
            <span className="font-bold text-emerald-400">{formatUsd(userPosition.availableToBorrowUsd)}</span>
          </div>
        </div>

        <Button onClick={onOpenSupply} variant="secondary" size="sm" className="w-full">
          Manage Collateral / Supply
        </Button>
      </Card>

      {/* Borrowed Debt */}
      <Card variant="glass" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Debt</span>
          <Badge variant="warning">USDC</Badge>
        </div>

        <div>
          <div className="text-3xl font-black text-white tracking-tight">
            {formatTokenAmount(userPosition.borrowedAmount, 7)} <span className="text-sm font-semibold text-slate-400">USDC</span>
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-1">
            ≈ {formatUsd(userPosition.borrowedValueUsd)} USD
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Borrow APY:</span>
            <span className="font-bold text-amber-400">{formatBps(market.state.borrowApyBps)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Supplied USDC Liquidity:</span>
            <span className="font-semibold text-slate-200">{formatTokenAmount(userPosition.suppliedAmount, 7)} USDC</span>
          </div>
        </div>

        <Button onClick={onOpenBorrow} variant="primary" size="sm" className="w-full">
          Borrow / Repay USDC
        </Button>
      </Card>

      {/* Health Factor */}
      <Card variant="glass" padding="md" className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Risk Assessment</span>
            <Badge variant={hfScore >= 1.5 ? 'safe' : hfScore >= 1.0 ? 'warning' : 'danger'}>
              {hfScore >= 1.5 ? 'Healthy' : hfScore >= 1.0 ? 'Caution' : 'Liquidatable'}
            </Badge>
          </div>

          <HealthGauge healthFactor={hfScore} />
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Liquidation Threshold:</span>
          <span className="font-semibold text-slate-300">{formatBps(market.config.liquidationThresholdBps)}</span>
        </div>
      </Card>
    </div>
  );
};
