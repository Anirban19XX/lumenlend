'use client';

import React, { useState } from 'react';
import { StatCard } from '@lumenlend/ui';
import { useLumenLend } from '../providers/LumenLendProvider';
import { formatTokenAmount, formatUsd } from '../lib/formatters';
import { PositionSummary } from '../components/positions/PositionSummary';
import { MarketCard } from '../components/markets/MarketCard';
import { SupplyModal } from '../components/lending/SupplyModal';
import { BorrowModal } from '../components/borrowing/BorrowModal';

export default function DashboardPage() {
  const { protocolStats, market } = useLumenLend();

  const [isSupplyOpen, setIsSupplyOpen] = useState(false);
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [supplyTab, setSupplyTab] = useState<'supply' | 'withdraw' | 'deposit_collat' | 'withdraw_collat'>('supply');
  const [borrowTab, setBorrowTab] = useState<'borrow' | 'repay'>('borrow');

  const openSupply = (tab: 'supply' | 'withdraw' | 'deposit_collat' | 'withdraw_collat' = 'supply') => {
    setSupplyTab(tab);
    setIsSupplyOpen(true);
  };

  const openBorrow = (tab: 'borrow' | 'repay' = 'borrow') => {
    setBorrowTab(tab);
    setIsBorrowOpen(true);
  };

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Stellar Soroban <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">Lending Protocol</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            Deposit native XLM as collateral, borrow USDC at algorithmically calculated kinked rates, and earn yield on supplied liquidity.
          </p>
        </div>
      </div>

      {/* Protocol Global Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Value Locked"
          value={formatUsd(protocolStats.totalValueLockedUsd, 0)}
          change="12.4%"
          isPositive={true}
        />
        <StatCard
          title="Total Supplied"
          value={`${formatTokenAmount(market.state.totalSupply, 7, 0)} USDC`}
          subValue={`≈ ${formatUsd(protocolStats.totalSuppliedUsd, 0)}`}
        />
        <StatCard
          title="Total Borrowed"
          value={`${formatTokenAmount(market.state.totalBorrowed, 7, 0)} USDC`}
          subValue={`≈ ${formatUsd(protocolStats.totalBorrowedUsd, 0)}`}
        />
        <StatCard
          title="Oracle XLM / USD"
          value="$0.120"
          subValue="Fixed-Point On-Chain Feed"
        />
      </div>

      {/* User Position Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white tracking-tight">Your Position</h2>
          <span className="text-xs text-slate-400">Account health and borrow allocation</span>
        </div>

        <PositionSummary
          onOpenSupply={() => openSupply('deposit_collat')}
          onOpenBorrow={() => openBorrow('borrow')}
        />
      </div>

      {/* Primary Market Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white tracking-tight">Available Markets</h2>
          <span className="text-xs text-slate-400">Permissionless lending pools</span>
        </div>

        <MarketCard
          onSupplyClick={() => openSupply('supply')}
          onBorrowClick={() => openBorrow('borrow')}
        />
      </div>

      {/* Modals */}
      <SupplyModal
        isOpen={isSupplyOpen}
        onClose={() => setIsSupplyOpen(false)}
        initialTab={supplyTab}
      />
      <BorrowModal
        isOpen={isBorrowOpen}
        onClose={() => setIsBorrowOpen(false)}
        initialTab={borrowTab}
      />
    </div>
  );
}
