'use client';

import React, { useState } from 'react';
import { Modal, Tabs, TokenInput, Button } from '@lumenlend/ui';
import { useLumenLend } from '../../providers/LumenLendProvider';
import { formatTokenAmount } from '../../lib/formatters';
import { TransactionStatus } from '../transactions/TransactionStatus';
import { parseTokenAmount, validateAvailableAmount } from '../../lib/amountValidation';

interface SupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'supply' | 'withdraw' | 'deposit_collat' | 'withdraw_collat';
}

export const SupplyModal: React.FC<SupplyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'supply',
}) => {
  const {
    userPosition,
    supplyUsdc,
    withdrawUsdc,
    depositXlmCollateral,
    withdrawXlmCollateral,
    isLoading,
    transactionStatus,
    transactionError,
    clearTransactionStatus,
  } = useLumenLend();

  const [activeTab, setActiveTab] = useState<'supply' | 'withdraw' | 'deposit_collat' | 'withdraw_collat'>(initialTab);
  const [amountInput, setAmountInput] = useState('');

  const tabs = [
    { id: 'supply' as const, label: 'Supply USDC' },
    { id: 'withdraw' as const, label: 'Withdraw USDC' },
    { id: 'deposit_collat' as const, label: 'Deposit XLM' },
    { id: 'withdraw_collat' as const, label: 'Withdraw XLM' },
  ];

  const parsedAmount = parseTokenAmount(amountInput);
  const availableAmount = activeTab === 'withdraw_collat'
    ? userPosition?.collateralAmount
    : activeTab === 'withdraw'
    ? userPosition?.suppliedAmount
    : undefined;
  const validationError = parsedAmount.error || (
    (activeTab === 'withdraw' || activeTab === 'withdraw_collat') && availableAmount === undefined
      ? 'Current wallet position is unavailable. Try again after it loads.'
      : parsedAmount.amount && availableAmount !== undefined
        ? validateAvailableAmount(parsedAmount.amount, availableAmount, activeTab === 'withdraw' ? 'supplied balance' : 'collateral balance')
        : null
  );

  const handleAction = async () => {
    if (!parsedAmount.amount || validationError) return;
    clearTransactionStatus();

    if (activeTab === 'supply') {
      await supplyUsdc(parsedAmount.amount);
    } else if (activeTab === 'withdraw') {
      await withdrawUsdc(parsedAmount.amount);
    } else if (activeTab === 'deposit_collat') {
      await depositXlmCollateral(parsedAmount.amount);
    } else if (activeTab === 'withdraw_collat') {
      await withdrawXlmCollateral(parsedAmount.amount);
    }

    setAmountInput('');
  };

  const isCollat = activeTab.includes('collat');
  const symbol = isCollat ? 'XLM' : 'USDC';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Liquidity & Collateral" maxWidth="md">
      <div className="space-y-6">
        <TransactionStatus status={transactionStatus} error={transactionError} />
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <TokenInput
          symbol={symbol}
          value={amountInput}
          onChange={setAmountInput}
          balance={
            isCollat
              ? activeTab === 'withdraw_collat'
                ? formatTokenAmount(userPosition?.collateralAmount || 0n, 7)
                : undefined
              : activeTab === 'withdraw'
              ? formatTokenAmount(userPosition?.suppliedAmount || 0n, 7)
              : undefined
          }
          onMaxClick={() => {
            if (activeTab === 'withdraw_collat') {
              setAmountInput((Number(userPosition?.collateralAmount || 0n) / 10_000_000).toString());
            } else if (activeTab === 'withdraw') {
              setAmountInput((Number(userPosition?.suppliedAmount || 0n) / 10_000_000).toString());
            } else {
              setAmountInput(isCollat ? '1000' : '500');
            }
          }}
        />
        {validationError && <p role="alert" className="text-sm text-rose-400">{validationError}</p>}

        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs space-y-2 text-slate-400">
          <div className="flex justify-between">
            <span>Transaction Type:</span>
            <span className="font-semibold text-slate-200 capitalize">
              {activeTab.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Protocol Network:</span>
            <span className="font-semibold text-cyan-400">Stellar Testnet</span>
          </div>
          <div className="flex justify-between">
            <span>Security Mechanism:</span>
            <span className="font-semibold text-emerald-400">On-Chain Soroban Verified</span>
          </div>
        </div>

        <Button
          onClick={handleAction}
          isLoading={isLoading}
          disabled={Boolean(validationError)}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Confirm {activeTab.replace('_', ' ')}
        </Button>
      </div>
    </Modal>
  );
};
