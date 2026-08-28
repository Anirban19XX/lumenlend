'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Search } from 'lucide-react';
import Link from 'next/link';
import { Card, Badge, Button } from '@lumenlend/ui';
import type { Market } from '@lumenlend/shared';
import { useLumenLend } from '../../providers/LumenLendProvider';
import { formatBps, formatTokenAmount, formatUsd } from '../../lib/formatters';
import { MarketCard } from '../../components/markets/MarketCard';
import { SupplyModal } from '../../components/lending/SupplyModal';
import { BorrowModal } from '../../components/borrowing/BorrowModal';

export default function MarketsPage() {
  const { market } = useLumenLend();
  const [isSupplyOpen, setIsSupplyOpen] = useState(false);
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'supplyApy' | 'borrowApy' | 'totalSupplied' | 'utilization' | 'risk'>('supplyApy');
  const [sortDescending, setSortDescending] = useState(true);
  const [filter, setFilter] = useState('');

  const visibleMarkets = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();
    const markets: Market[] = [market].filter((item) => {
      if (!normalizedFilter) return true;
      const { collateralAsset, borrowAsset } = item.config;
      return [
        item.config.marketId,
        collateralAsset.symbol,
        borrowAsset.symbol,
        `${collateralAsset.symbol} / ${borrowAsset.symbol}`,
      ].some((value) => value.toLowerCase().includes(normalizedFilter));
    });

    return markets.sort((left, right) => {
      const values = {
        supplyApy: [left.state.supplyApyBps, right.state.supplyApyBps],
        borrowApy: [left.state.borrowApyBps, right.state.borrowApyBps],
        totalSupplied: [left.state.totalSupply, right.state.totalSupply],
        utilization: [left.state.utilizationBps, right.state.utilizationBps],
        risk: [left.config.liquidationThresholdBps, right.config.liquidationThresholdBps],
      }[sortBy];
      const comparison = values[0] < values[1] ? -1 : values[0] > values[1] ? 1 : 0;
      return sortDescending ? -comparison : comparison;
    });
  }, [filter, market, sortBy, sortDescending]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Lending Markets</h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore Stellar Soroban lending markets, inspect mathematical interest curves, and review risk configurations.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative flex min-w-0 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" aria-hidden="true" />
            <span className="sr-only">Filter markets by asset or market name</span>
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter assets or markets"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-2 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500/60"
            />
          </label>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="market-sort">Sort markets by</label>
            <select
              id="market-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/60"
            >
              <option value="supplyApy">Supply APY</option>
              <option value="borrowApy">Borrow APY</option>
              <option value="totalSupplied">Total supplied</option>
              <option value="utilization">Utilization</option>
              <option value="risk">Risk level</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortDescending((current) => !current)}
              title={sortDescending ? 'Sort ascending' : 'Sort descending'}
              aria-label={sortDescending ? 'Sort ascending' : 'Sort descending'}
              leftIcon={sortDescending ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
            />
          </div>
        </div>

        {visibleMarkets.length > 0 ? visibleMarkets.map((visibleMarket) => (
          <div key={visibleMarket.config.marketId}>
            <MarketCard
              market={visibleMarket}
              onSupplyClick={() => setIsSupplyOpen(true)}
              onBorrowClick={() => setIsBorrowOpen(true)}
            />
            <div className="flex justify-end">
              <Link
                href={`/markets/${encodeURIComponent(visibleMarket.config.marketId)}`}
                className="text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
              >
                View market details <span aria-hidden="true">-&gt;</span>
              </Link>
            </div>
          </div>
        )) : (
          <Card variant="glass" padding="lg" className="text-center">
            <h2 className="text-lg font-bold text-white">No markets found</h2>
            <p className="mt-1 text-sm text-slate-400">Try a different asset or market name.</p>
          </Card>
        )}
      </div>

      {/* Planned Future Isolated Markets Roadmap */}
      <div className="space-y-4 pt-6">
        <h2 className="text-xl font-black text-white tracking-tight">Upcoming Isolated Markets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass" padding="md" className="border-dashed border-slate-800/80 opacity-75">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-base">BTC / USDC</span>
              <Badge variant="neutral">Roadmap</Badge>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Wrapped Bitcoin collateral pool with 70% Max LTV and Reflector/Pyth oracle integration.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">Status: Planned Q3 2026</div>
          </Card>

          <Card variant="glass" padding="md" className="border-dashed border-slate-800/80 opacity-75">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-base">ETH / USDC</span>
              <Badge variant="neutral">Roadmap</Badge>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Ether collateral pool with 75% Max LTV and dynamic kinked interest parameters.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">Status: Planned Q3 2026</div>
          </Card>

          <Card variant="glass" padding="md" className="border-dashed border-slate-800/80 opacity-75">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white text-base">RWA / USDC</span>
              <Badge variant="neutral">Roadmap</Badge>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real-World Asset (Treasury &amp; Credit) backed isolated lending market.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">Status: Planned Q4 2026</div>
          </Card>
        </div>
      </div>

      <SupplyModal isOpen={isSupplyOpen} onClose={() => setIsSupplyOpen(false)} />
      <BorrowModal isOpen={isBorrowOpen} onClose={() => setIsBorrowOpen(false)} />
    </div>
  );
}
