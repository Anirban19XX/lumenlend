'use client';

import React, { useState } from 'react';
import { AlertCircle, Check, Copy, LogOut, Wallet } from 'lucide-react';
import { Badge, Button, Modal } from '@lumenlend/ui';
import { useWallet } from '../../providers/WalletProvider';
import { truncateAddress } from '../../lib/formatters';

export const WalletConnectButton: React.FC = () => {
  const { isConnected, address, connect, disconnect, network, isConnecting, error } = useWallet();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isRejected = error?.toLowerCase().includes('reject') || error?.toLowerCase().includes('denied');

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1500);
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="safe" size="sm" className="hidden sm:inline-flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="capitalize">{network}</span>
        </Badge>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsDetailsOpen(true)}
          title={`Connected wallet: ${address}`}
          aria-label={`View connected wallet ${truncateAddress(address)}`}
          leftIcon={<Wallet className="h-4 w-4" aria-hidden="true" />}
        >
          <span>{truncateAddress(address)}</span>
        </Button>

        <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Wallet connected" maxWidth="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="safe" size="sm">Connected</Badge>
              <span className="text-sm capitalize text-slate-400">{network}</span>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Stellar address</p>
              <p className="break-all rounded-xl border border-slate-800 bg-slate-950/60 p-3 font-mono text-xs text-slate-300">{address}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={copyAddress} leftIcon={isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
                {isCopied ? 'Copied' : 'Copy address'}
              </Button>
              <Button variant="danger" size="sm" onClick={async () => { await disconnect(); setIsDetailsOpen(false); }} leftIcon={<LogOut className="h-4 w-4" />}>
                Disconnect
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  if (isConnecting) {
    return <Button isLoading size="sm" aria-live="polite">Connecting...</Button>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="danger" size="sm" title={error}>
          <AlertCircle className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          {isRejected ? 'Connection rejected' : 'Connection failed'}
        </Badge>
        <Button variant="outline" size="sm" onClick={connect} leftIcon={<Wallet className="h-4 w-4" aria-hidden="true" />}>
          Try again
        </Button>
      </div>
    );
  }

  return <Button size="sm" onClick={connect} leftIcon={<Wallet className="h-4 w-4" aria-hidden="true" />}>Connect Freighter</Button>;
};
