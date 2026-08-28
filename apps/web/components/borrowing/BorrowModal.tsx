'use client';

import React, { useState } from 'react';
import { Modal, Tabs, TokenInput, Button, HealthGauge } from '@lumenlend/ui';
import { calculateHealthFactor, tokenAmountToUsd } from '@lumenlend/shared';
import { useLumenLend } from '../../providers/LumenLendProvider';
import { formatBps, formatTokenAmount, formatUsd } from '../../lib/formatters';
import { TransactionStatus } from '../transactions/TransactionStatus';
import { parseTokenAmount, validateAvailableAmount } from '../../lib/amountValidation';

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
  const { userPosition, market, borrowUsdc, repayUsdc, isLoading, transactionStatus, transactionError, clearTransactionStatus } = useLumenLend();
  const [activeTab, setActiveTab] = useState<'borrow' | 'repay'>(initialTab);
  const [amountInput, setAmountInput] = useState('');

  const tabs = [
    { id: 'borrow' as const, label: 'Borrow USDC' },
    { id: 'repay' as const, label: 'Repay USDC' },
  ];

  const parsedAmount = parseTokenAmount(amountInput);
  const parsedAmountBigInt = parsedAmount.amount || 0n;
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
  const availableLiquidity = market.state.totalSupply > market.state.totalBorrowed
    ? market.state.totalSupply - market.state.totalBorrowed
    : 0n;
  const borrowValidationError = activeTab === 'borrow' && parsedAmount.amount
    ? validateAvailableAmount(parsedAmount.amount, availableLiquidity, 'market liquidity')
    : null;
  const repayValidationError = activeTab === 'repay' && parsedAmount.amount
    ? validateAvailableAmount(parsedAmount.amount, currentDebt, 'borrowed balance')
    : null;
  const validationError = parsedAmount.error || borrowValidationError || repayValidationError || (
    activeTab === 'borrow' && !userPosition
      ? 'Borrowing capacity is unavailable. Try again after your position loads.'
      : activeTab === 'borrow' && parsedAmount.amount && userPosition && simulatedDebtUsd > userPosition.borrowCapacityUsd
        ? 'Amount exceeds your available borrowing capacity.'
        : null
  );

  const handleAction = async () => {
    if (!parsedAmount.amount || validationError) return;
    clearTransactionStatus();
    if (activeTab === 'borrow') {
      await borrowUsdc(parsedAmount.amount);
    } else {
      await repayUsdc(parsedAmount.amount);
    }
    setAmountInput('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Borrow & Repay Market" maxWidth="md">
      <div className="space-y-6">
        <TransactionStatus status={transactionStatus} error={transactionError} />
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
        {validationError && <p role="alert" className="text-sm text-rose-400">{validationError}</p>}

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
            Boolean(validationError) ||
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
