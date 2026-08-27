'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Modal, TokenInput } from '@lumenlend/ui';
import { useLumenLend } from '../../providers/LumenLendProvider';
import { formatBps, formatTokenAmount, formatUsd, truncateAddress } from '../../lib/formatters';

interface LiquidatableRow {
  borrower: string;
  collateralXlm: bigint;
  debtUsdc: bigint;
  healthFactor: number;
  bonusBps: number;
}

const mockLiquidatables: LiquidatableRow[] = [
  {
    borrower: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    collateralXlm: 25_000_0000000n, // 25,000 XLM = $3,000
    debtUsdc: 2_650_0000000n,       // $2,650 USDC => HF = 0.90
    healthFactor: 0.90,
    bonusBps: 500,
  },
  {
    borrower: 'GCKAZW2J636R5NYVSD27KND4D5V3ZPQX4NUPP62R7346A2Q344J2US6Q',
    collateralXlm: 12_500_0000000n, // 12,500 XLM = $1,500
    debtUsdc: 1_350_0000000n,       // $1,350 USDC => HF = 0.88
    healthFactor: 0.88,
    bonusBps: 500,
  },
];

export const LiquidationTable: React.FC = () => {
  const { liquidatePosition, isLoading } = useLumenLend();
  const [selectedBorrower, setSelectedBorrower] = useState<LiquidatableRow | null>(null);
  const [repayAmount, setRepayAmount] = useState('');

  const handleLiquidate = async () => {
    if (!selectedBorrower) return;
    const parsed = BigInt(Math.floor(parseFloat(repayAmount || '0') * 10_000_000));
    await liquidatePosition(selectedBorrower.borrower, parsed);
    setSelectedBorrower(null);
  };

  return (
    <div className="space-y-6">
      <Card variant="glass" padding="none" className="overflow-hidden border-slate-800/80">
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Liquidatable Positions</h3>
              <p className="text-xs text-slate-400 mt-1">
                Repay unhealthy loans on Stellar Soroban to seize collateral with a 5% liquidation bonus.
              </p>
            </div>
            <Badge variant="danger">{mockLiquidatables.length} Liquidatable</Badge>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Borrower</th>
                <th className="py-3 px-6">Collateral (XLM)</th>
                <th className="py-3 px-6">Outstanding Debt (USDC)</th>
                <th className="py-3 px-6">Health Factor</th>
                <th className="py-3 px-6">Bonus</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {mockLiquidatables.map((row) => (
                <tr key={row.borrower} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-white">
                    {truncateAddress(row.borrower, 6, 6)}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-white">{formatTokenAmount(row.collateralXlm, 7)}</span> XLM
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-white">{formatTokenAmount(row.debtUsdc, 7)}</span> USDC
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant="danger">{row.healthFactor.toFixed(2)} HF</Badge>
                  </td>
                  <td className="py-4 px-6 font-bold text-emerald-400">
                    +{formatBps(row.bonusBps)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Button
                      onClick={() => {
                        setSelectedBorrower(row);
                        setRepayAmount((Number(row.debtUsdc) / 20_000_000).toString()); // 50% close factor default
                      }}
                      variant="danger"
                      size="sm"
                    >
                      Liquidate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Liquidation Execution Modal */}
      {selectedBorrower && (
        <Modal
          isOpen={!!selectedBorrower}
          onClose={() => setSelectedBorrower(null)}
          title="Execute On-Chain Liquidation"
          maxWidth="md"
        >
          <div className="space-y-6">
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs space-y-1 text-rose-300">
              <span className="font-bold">Borrower Position Delinquent</span>
              <p className="text-rose-400/80">
                Health Factor is {selectedBorrower.healthFactor.toFixed(2)} (&lt; 1.0). Maximum close factor allows repaying up to 50% of the loan.
              </p>
            </div>

            <TokenInput
              symbol="USDC"
              value={repayAmount}
              onChange={setRepayAmount}
              placeholder="0.0"
              balance={formatTokenAmount(selectedBorrower.debtUsdc, 7)}
            />

            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-2 text-slate-400">
              <div className="flex justify-between">
                <span>Borrower:</span>
                <span className="font-mono text-slate-200">{truncateAddress(selectedBorrower.borrower, 6, 6)}</span>
              </div>
              <div className="flex justify-between">
                <span>Seized Collateral Bonus:</span>
                <span className="font-bold text-emerald-400">+{formatBps(selectedBorrower.bonusBps)}</span>
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
