import React from 'react';
import type { Metadata } from 'next';
import '../styles/globals.css';
import { WalletProvider } from '../providers/WalletProvider';
import { LumenLendProvider } from '../providers/LumenLendProvider';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'LumenLend | Permissionless Stellar Lending Protocol',
  description: 'Production-grade decentralized lending protocol built on Stellar Soroban with XLM collateral and USDC borrowing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07090e] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-300">
        <WalletProvider>
          <LumenLendProvider>
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </LumenLendProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
