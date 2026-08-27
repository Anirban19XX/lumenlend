'use client';

import React from 'react';
import { LiquidationTable } from '../../components/liquidation/LiquidationTable';
import { AdminRiskPanel } from '../../components/liquidation/AdminRiskPanel';

export default function LiquidationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Liquidation Engine Monitor</h1>
        <p className="text-sm text-slate-400 mt-1">
          Permissionless on-chain liquidation monitor. Any participant can repay undercollateralized debt in exchange for discounted collateral plus liquidation incentives.
        </p>
      </div>

      <AdminRiskPanel />
      <LiquidationTable />
    </div>
  );
}
