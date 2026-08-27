'use client';

import React, { useState } from 'react';
import { Modal, Tabs, TokenInput, Button, HealthGauge } from '@lumenlend/ui';
import { calculateHealthFactor, tokenAmountToUsd } from '@lumenlend/shared';
import { useLumenLend } from '../../providers/LumenLendProvider';
import { formatBps, formatTokenAmount, formatUsd } from '../../lib/formatters';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'borrow' | 'repay';
}

export const BorrowModal: React.FC<BorrowModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'borrow',
}) => {
  const { userPosition, market, borrowUsdc, repayUsdc, isLoading } = useLumenLend();
  const [activeTab, setActiveTab] = useState<'borrow' | 'repay'>(initialTab);
  const [amountInput, setAmountInput] = useState('');

  const tabs = [
    { id: 'borrow' as const, label: 'Borrow USDC' },
    { id: 'repay' as const, label: 'Repay USDC' },
  ];

  const parsedAmountBigInt = BigInt(Math.floor(parseFloat(amountInput || '0') * 10_000_000));
  const currentDebt = userPosition?.borrowedAmount || 0n;
  const simulatedDebt = activeTab === 'borrow'
    ? currentDebt + parsedAmountBigInt
    : currentDebt > parsedAmountBigInt
    ? currentDebt - parsedAmountBigInt
    : 0n;

  const simulatedDebtUsd = tokenAmountToUsd(simulatedDebt, 7, market.state.borrowPriceUsd);
  const simulatedHf = calculateHealthFactor(
    userPosition?.collateralValueUsd || 0n,
    simulatedDebtUsd,
    market.config.liquidationThresholdBps
  );

  const handleAction = async () => {
    if (parsedAmountBigInt <= 0n) return;
    if (activeTab === 'borrow') {
      await borrowUsdc(parsedAmountBigInt);
    } else {
      await repayUsdc(parsedAmountBigInt);
    }
    setAmountInput('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Borrow & Repay Market" maxWidth="md">
      <div className="space-y-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <TokenInput
          symbol="USDC"
          value={amountInput}
          onChange={setAmountInput}
          balance={
            activeTab === 'borrow'
              ? formatTokenAmount(
                  (userPosition?.availableToBorrowUsd || 0n) * 10_000_000n / 1_000_000_000n,
                  7
                )
              : formatTokenAmount(userPosition?.borrowedAmount || 0n, 7)
          }
          onMaxClick={() => {
            if (activeTab === 'repay') {
              setAmountInput((Number(userPosition?.borrowedAmount || 0n) / 10_000_000).toString());
            } else {
              const maxBorrowTokens = Number(userPosition?.availableToBorrowUsd || 0n) / 1_000_000_000;
              setAmountInput(Math.max(0, maxBorrowTokens).toFixed(2));
            }
          }}
        />

        {/* Health Factor Simulation */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400">Projected Health Factor</span>
          <HealthGauge healthFactor={simulatedHf.score} />
        </div>

        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-2 text-slate-400">
          <div className="flex justify-between">
            <span>Borrow APY:</span>
            <span className="font-semibold text-amber-400">{formatBps(market.state.borrowApyBps)}</span>
          </div>
          <div className="flex justify-between">
            <span>Liquidation Threshold:</span>
            <span className="font-semibold text-slate-200">{formatBps(market.config.liquidationThresholdBps)}</span>
          </div>
        </div>

        <Button
          onClick={handleAction}
          isLoading={isLoading}
          disabled={
            !amountInput ||
            parseFloat(amountInput) <= 0 ||
            (activeTab === 'borrow' && simulatedHf.status === 'liquidatable')
          }
          variant="primary"
          size="lg"
          className="w-full"
        >
          Confirm {activeTab === 'borrow' ? 'Borrow USDC' : 'Repay USDC'}
        </Button>
      </div>
    </Modal>
  );
};
