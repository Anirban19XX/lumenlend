'use client';

import React, { useState } from 'react';
import { useWallet } from '../../providers/WalletProvider';
import { truncateAddress } from '../../lib/formatters';

export const WalletConnectButton: React.FC = () => {
  const { isConnected, address, connect, disconnect, network, isConnecting } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="capitalize">{network}</span>
        </div>

        <button
          onClick={disconnect}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-white transition-all shadow-lg active:scale-95"
        >
          <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500" />
          <span>{truncateAddress(address)}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
    >
      {isConnecting ? (
        <span>Connecting...</span>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="4" />
            <path d="M16 12h.01" />
          </svg>
          <span>Connect Freighter</span>
        </>
      )}
    </button>
  );
};
