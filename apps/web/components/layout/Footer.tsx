import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 py-8 bg-slate-950/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="font-semibold text-slate-400">Experimental / Unaudited Protocol</span>
          <span>• Built for Stellar Soroban</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://stellar.org/soroban"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors"
          >
            Stellar Docs
          </a>
          <a
            href="https://github.com/stellar/freighter"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors"
          >
            Freighter Wallet
          </a>
          <span>© 2026 LumenLend Protocol</span>
        </div>
      </div>
    </footer>
  );
};
