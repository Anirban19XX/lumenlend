'use client';

import React, { useState } from 'react';
import { Card, Button } from '@lumenlend/ui';
import { useLumenLend } from '../../providers/LumenLendProvider';

// In a single-asset market, collateral and debt share one oracle price, so it cancels
// out of the health-factor calculation — a price move alone can never make a position
// liquidatable here. Adjusting the liquidation threshold (a real governance lever) is
// what actually moves health factors, and is the only way to demo liquidation.
export const AdminRiskPanel: React.FC = () => {
  const { isAdmin, setLiquidationThresholdBps, isLoading } = useLumenLend();
  const [bps, setBps] = useState('8000');

  if (!isAdmin) return null;

  return (
    <Card variant="glass" padding="md" className="border-amber-500/30">
      <h3 className="text-sm font-black text-amber-400 tracking-tight mb-1">Admin: Risk Parameters</h3>
      <p className="text-xs text-slate-400 mb-4">
        Lowering the liquidation threshold makes existing positions liquidatable without
        needing a price move — useful for demoing liquidation on a single-asset market.
      </p>
      <div className="flex gap-3">
        <input
          value={bps}
          onChange={(e) => setBps(e.target.value)}
          placeholder="Liquidation threshold (bps, e.g. 8000 = 80%)"
          className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50"
        />
        <Button
          onClick={() => setLiquidationThresholdBps(parseInt(bps, 10))}
          isLoading={isLoading}
          disabled={!bps}
          variant="danger"
        >
          Update
        </Button>
      </div>
    </Card>
  );
};
