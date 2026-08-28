'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Card, StatCard } from '@lumenlend/ui';
import { useLumenLend } from '../../../providers/LumenLendProvider';
import { formatBps, formatTokenAmount, formatUsd } from '../../../lib/formatters';
import { MarketCard } from '../../../components/markets/MarketCard';
import { SupplyModal } from '../../../components/lending/SupplyModal';
import { BorrowModal } from '../../../components/borrowing/BorrowModal';

export default function MarketDetailPage() {
  const params = useParams<{ marketId: string }>();
  const { market } = useLumenLend();
  const [isSupplyOpen, setIsSupplyOpen] = useState(false);
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const isAvailable = market.state.marketId === params.marketId && market.state.lastUpdatedTimestamp > 0;

  if (!isAvailable) {
    return (
      <div className="space-y-6">
        <Link href="/markets" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to markets
        </Link>
        <Card variant="glass" padding="lg" className="text-center">
          <h1 className="text-xl font-black text-white">Market data unavailable</h1>
          <p className="mt-2 text-sm text-slate-400">This market is not available from the current data source.</p>
        </Card>
      </div>
    );
  }

  const { config, state } = market;
  const pair = `${config.collateralAsset.symbol} / ${config.borrowAsset.symbol}`;
  const tokenDecimals = config.borrowAsset.decimals;
  const lastUpdated = new Date(state.lastUpdatedTimestamp).toLocaleString();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/markets" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to markets
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-white">{pair} Market</h1>
          <p className="mt-1 text-sm text-slate-400">Read-only market details and current protocol parameters.</p>
        </div>
      </div>

      <MarketCard
        market={market}
        onSupplyClick={() => setIsSupplyOpen(true)}
        onBorrowClick={() => setIsBorrowOpen(true)}
      />

      <section className="space-y-4" aria-labelledby="market-overview-heading">
        <h2 id="market-overview-heading" className="text-xl font-black tracking-tight text-white">Market overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Supply APY" value={formatBps(state.supplyApyBps)} />
          <StatCard title="Borrow APY" value={formatBps(state.borrowApyBps)} />
          <StatCard title="Total Supplied" value={`${formatTokenAmount(state.totalSupply, tokenDecimals)} ${config.borrowAsset.symbol}`} />
          <StatCard title="Total Borrowed" value={`${formatTokenAmount(state.totalBorrowed, tokenDecimals)} ${config.borrowAsset.symbol}`} />
          <StatCard title="Utilization" value={formatBps(state.utilizationBps)} />
          <StatCard title="Collateral Price" value={formatUsd(state.collateralPriceUsd, 4)} subValue={config.collateralAsset.symbol} />
          <StatCard title="Borrow-Asset Price" value={formatUsd(state.borrowPriceUsd, 4)} subValue={config.borrowAsset.symbol} />
        </div>
      </section>

      <Card variant="glass" padding="md">
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <span className="block text-xs text-slate-500">Max LTV</span>
            <span className="font-bold text-slate-200">{formatBps(config.maxLtvBps)}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Liquidation Threshold</span>
            <span className="font-bold text-slate-200">{formatBps(config.liquidationThresholdBps)}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Liquidation Bonus</span>
            <span className="font-bold text-slate-200">{formatBps(config.liquidationBonusBps)}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Reserve Factor</span>
            <span className="font-bold text-slate-200">{formatBps(config.reserveFactorBps)}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">Last Updated</span>
            <span className="font-bold text-slate-200">{lastUpdated}</span>
          </div>
        </div>
      </Card>

      <SupplyModal isOpen={isSupplyOpen} onClose={() => setIsSupplyOpen(false)} />
      <BorrowModal isOpen={isBorrowOpen} onClose={() => setIsBorrowOpen(false)} />
    </div>
  );
}