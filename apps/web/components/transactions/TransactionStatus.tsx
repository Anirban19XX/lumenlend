'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, Send, ShieldCheck, Wallet } from 'lucide-react';
import type { TransactionLifecycleStatus } from '@lumenlend/contracts-client';

interface TransactionStatusProps {
  status: TransactionLifecycleStatus | null;
  error?: string | null;
}

const statusDetails: Record<Exclude<TransactionLifecycleStatus, 'failed'>, { label: string; icon: React.ReactNode }> = {
  preparing: { label: 'Preparing transaction', icon: <LoaderCircle className="h-4 w-4 animate-spin" /> },
  awaitingApproval: { label: 'Awaiting wallet approval', icon: <Wallet className="h-4 w-4" /> },
  submitted: { label: 'Transaction submitted', icon: <Send className="h-4 w-4" /> },
  confirming: { label: 'Confirming on Stellar', icon: <Clock3 className="h-4 w-4" /> },
  successful: { label: 'Transaction successful', icon: <CheckCircle2 className="h-4 w-4" /> },
};

export const TransactionStatus: React.FC<TransactionStatusProps> = ({ status, error }) => {
  if (!status) return null;

  const isFailed = status === 'failed';
  const details = isFailed
    ? { label: 'Transaction failed', icon: <AlertCircle className="h-4 w-4" /> }
    : statusDetails[status];

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl border p-3 text-sm ${
        isFailed
          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          : status === 'successful'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
      }`}
    >
      <span className="mt-0.5 shrink-0">{details.icon}</span>
      <span>
        <span className="block font-semibold">{details.label}</span>
        {isFailed && error && <span className="mt-1 block text-xs opacity-80">{error}</span>}
      </span>
    </div>
  );
};