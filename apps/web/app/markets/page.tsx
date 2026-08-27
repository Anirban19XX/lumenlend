'use client';

import React, { useState } from 'react';
import { Card, Badge, Button } from '@lumenlend/ui';
import { useLumenLend } from '../../providers/LumenLendProvider';
import { formatBps, formatTokenAmount, formatUsd } from '../../lib/formatters';
import { MarketCard } from '../../components/markets/MarketCard';
import { SupplyModal } from '../../components/lending/SupplyModal';
import { BorrowModal } from '../../components/borrowing/BorrowModal';

export default function MarketsPage() {
  const { market } = useLumenLend();
  const [isSupplyOpen, setIsSupplyOpen] = useState(false);
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Lending Markets</h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore Stellar Soroban lending markets, inspect mathematical interest curves, and review risk configurations.
        </p>
      </div>

      <MarketCard
        onSupplyClick={() => setIsSupplyOpen(true)}
        onBorrowClick={() => setIsBorrowOpen(true)}
      />

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
