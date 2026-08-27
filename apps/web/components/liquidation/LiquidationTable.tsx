'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Modal, TokenInput } from '@lumenlend/ui';
import { useLumenLend } from '../../providers/LumenLendProvider';
import { formatBps, formatTokenAmount, truncateAddress } from '../../lib/formatters';

interface LookupResult {
  borrower: string;
  isLiquidatable: boolean;
  healthFactorBps: number;
  debt: bigint;
  collateral: bigint;
}

export const LiquidationTable: React.FC = () => {
  const { liquidatePosition, checkLiquidatable, isLoading } = useLumenLend();
  const [borrowerInput, setBorrowerInput] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (!borrowerInput) return;
    setChecking(true);
    try {
      const res = await checkLiquidatable(borrowerInput);
      setResult({ borrower: borrowerInput, ...res });
      setRepayAmount((Number(res.debt) / 20_000_000).toString()); // 50% close factor default
    } finally {
      setChecking(false);
    }
  };

  const handleLiquidate = async () => {
    if (!result) return;
    const parsed = BigInt(Math.floor(parseFloat(repayAmount || '0') * 10_000_000));
    await liquidatePosition(result.borrower, parsed);
    setResult(null);
    setBorrowerInput('');
  };

  return (
    <div className="space-y-6">
      <Card variant="glass" padding="none" className="overflow-hidden border-slate-800/80">
        <div className="p-6 border-b border-slate-800/80">
          <h3 className="text-lg font-black text-white tracking-tight">Check a Position</h3>
          <p className="text-xs text-slate-400 mt-1">
            Look up any borrower&apos;s on-chain health factor. Positions below 1.0 can be liquidated
            for a 5% collateral bonus.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <input
              value={borrowerInput}
              onChange={(e) => setBorrowerInput(e.target.value.trim())}
              placeholder="Borrower address (G...)"
              className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-mono text-slate-200 outline-none focus:border-cyan-500/50"
            />
            <Button onClick={handleCheck} isLoading={checking} disabled={!borrowerInput} variant="primary">
              Check
            </Button>
          </div>

          {result && (
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Borrower:</span>
                <span className="font-mono text-slate-200">{truncateAddress(result.borrower, 6, 6)}</span>
              </div>
              <div className="flex justify-between">
                <span>Collateral (XLM):</span>
                <span className="font-bold text-white">{formatTokenAmount(result.collateral, 7)}</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Debt (XLM):</span>
                <span className="font-bold text-white">{formatTokenAmount(result.debt, 7)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Health Factor:</span>
                <Badge variant={result.isLiquidatable ? 'danger' : 'safe'}>
                  {result.healthFactorBps >= 999_999 ? '∞' : (result.healthFactorBps / 10_000).toFixed(2)} HF
                </Badge>
              </div>
              {!result.isLiquidatable && (
                <p className="text-emerald-400 pt-1">Position is healthy — not liquidatable.</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {result?.isLiquidatable && (
        <Modal
          isOpen={result.isLiquidatable}
          onClose={() => setResult(null)}
          title="Execute On-Chain Liquidation"
          maxWidth="md"
        >
          <div className="space-y-6">
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs space-y-1 text-rose-300">
              <span className="font-bold">Borrower Position Delinquent</span>
              <p className="text-rose-400/80">
                Health Factor is {(result.healthFactorBps / 10_000).toFixed(2)} (&lt; 1.0). Maximum close
                factor allows repaying up to 50% of the loan.
              </p>
            </div>

            <TokenInput
              symbol="XLM"
              value={repayAmount}
              onChange={setRepayAmount}
              placeholder="0.0"
              balance={formatTokenAmount(result.debt, 7)}
            />

            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Borrower:</span>
                <span className="font-mono text-slate-200">{truncateAddress(result.borrower, 6, 6)}</span>
              </div>
              <div className="flex justify-between">
                <span>Liquidation Bonus:</span>
                <span className="font-bold text-emerald-400">+{formatBps(500)}</span>
              </div>
            </div>

            <Button
              onClick={handleLiquidate}
              isLoading={isLoading}
              variant="danger"
              size="lg"
              className="w-full"
            >
              Confirm Liquidation Transaction
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
