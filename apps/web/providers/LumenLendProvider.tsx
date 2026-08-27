'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  calculateBorrowCapacity,
  calculateBorrowRate,
  calculateHealthFactor,
  calculateSupplyRate,
  calculateUtilization,
  DEFAULT_XLM_USDC_MARKET_CONFIG,
  tokenAmountToUsd,
  type Market,
  type ProtocolStats,
  type UserPosition,
} from '@lumenlend/shared';
import { useWallet } from './WalletProvider';

interface LumenLendContextType {
  market: Market;
  userPosition: UserPosition | null;
  protocolStats: ProtocolStats;
  isLoading: boolean;
  supplyUsdc: (amount: bigint) => Promise<void>;
  withdrawUsdc: (amount: bigint) => Promise<void>;
  depositXlmCollateral: (amount: bigint) => Promise<void>;
  withdrawXlmCollateral: (amount: bigint) => Promise<void>;
  borrowUsdc: (amount: bigint) => Promise<void>;
  repayUsdc: (amount: bigint) => Promise<void>;
  liquidatePosition: (borrower: string, repayAmount: bigint) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultMarket: Market = {
  config: DEFAULT_XLM_USDC_MARKET_CONFIG,
  state: {
    marketId: 'XLM-USDC-V1',
    totalSupply: 1_250_000_0000000n, // 1,250,000 USDC
    totalBorrowed: 500_000_0000000n,  // 500,000 USDC
    totalReserves: 25_000_0000000n,
    utilizationBps: 4000,             // 40%
    borrowApyBps: 450,                // 4.5%
    supplyApyBps: 162,                // 1.62%
    collateralPriceUsd: 120_000_000n, // $0.12
    borrowPriceUsd: 1_000_000_000n,   // $1.00
    lastUpdatedTimestamp: Date.now(),
  },
};

const defaultStats: ProtocolStats = {
  totalValueLockedUsd: 4_500_000_000_000n, // $4,500,000 TVL
  totalSuppliedUsd: 1_250_000_000_000n,
  totalBorrowedUsd: 500_000_000_000n,
  totalCollateralUsd: 3_250_000_000_000n,
  totalReservesUsd: 25_000_000_000n,
  activeUsersCount: 184,
  marketsCount: 1,
};

const LumenLendContext = createContext<LumenLendContextType | undefined>(undefined);

export const LumenLendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, address } = useWallet();
  const [market, setMarket] = useState<Market>(defaultMarket);
  const [protocolStats, setProtocolStats] = useState<ProtocolStats>(defaultStats);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculatePosition = useCallback(
    (collateral: bigint, supplied: bigint, borrowed: bigint): UserPosition => {
      const userAddr = address || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
      const collateralValueUsd = tokenAmountToUsd(collateral, 7, market.state.collateralPriceUsd);
      const borrowedValueUsd = tokenAmountToUsd(borrowed, 7, market.state.borrowPriceUsd);
      const borrowCapacityUsd = calculateBorrowCapacity(collateralValueUsd, market.config.maxLtvBps);
      const availableToBorrowUsd = borrowCapacityUsd > borrowedValueUsd ? borrowCapacityUsd - borrowedValueUsd : 0n;

      const hf = calculateHealthFactor(
        collateralValueUsd,
        borrowedValueUsd,
        market.config.liquidationThresholdBps
      );

      return {
        userAddress: userAddr,
        marketId: market.config.marketId,
        suppliedAmount: supplied,
        borrowedAmount: borrowed,
        collateralAmount: collateral,
        collateralValueUsd,
        borrowedValueUsd,
        borrowCapacityUsd,
        availableToBorrowUsd,
        healthFactorBps: hf.basisPoints,
        isLiquidatable: hf.status === 'liquidatable',
        lastUpdated: Date.now(),
      };
    },
    [address, market]
  );

  useEffect(() => {
    if (isConnected && address) {
      // Initialize starter position for connected demo account
      setUserPosition(calculatePosition(10_000_0000000n, 500_0000000n, 300_0000000n));
    } else {
      setUserPosition(null);
    }
  }, [isConnected, address, calculatePosition]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      // Re-calculate market utilization and interest APYs
      const util = calculateUtilization(market.state.totalBorrowed, market.state.totalSupply);
      const bRate = calculateBorrowRate(util, market.config);
      const sRate = calculateSupplyRate(bRate, util, market.config.reserveFactorBps);

      setMarket((prev) => ({
        ...prev,
        state: {
          ...prev.state,
          utilizationBps: util,
          borrowApyBps: bRate,
          supplyApyBps: sRate,
        },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const supplyUsdc = async (amount: bigint) => {
    setIsLoading(true);
    try {
      setMarket((prev) => ({
        ...prev,
        state: {
          ...prev.state,
          totalSupply: prev.state.totalSupply + amount,
        },
      }));

      if (userPosition) {
        setUserPosition((prev) =>
          prev ? calculatePosition(prev.collateralAmount, prev.suppliedAmount + amount, prev.borrowedAmount) : null
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawUsdc = async (amount: bigint) => {
    setIsLoading(true);
    try {
      setMarket((prev) => ({
        ...prev,
        state: {
          ...prev.state,
          totalSupply: prev.state.totalSupply - amount,
        },
      }));

      if (userPosition) {
        setUserPosition((prev) =>
          prev ? calculatePosition(prev.collateralAmount, prev.suppliedAmount - amount, prev.borrowedAmount) : null
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const depositXlmCollateral = async (amount: bigint) => {
    setIsLoading(true);
    try {
      if (userPosition) {
        setUserPosition((prev) =>
          prev ? calculatePosition(prev.collateralAmount + amount, prev.suppliedAmount, prev.borrowedAmount) : null
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawXlmCollateral = async (amount: bigint) => {
    setIsLoading(true);
    try {
      if (userPosition) {
        setUserPosition((prev) =>
          prev ? calculatePosition(prev.collateralAmount - amount, prev.suppliedAmount, prev.borrowedAmount) : null
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const borrowUsdc = async (amount: bigint) => {
    setIsLoading(true);
    try {
      setMarket((prev) => ({
        ...prev,
        state: {
          ...prev.state,
          totalBorrowed: prev.state.totalBorrowed + amount,
        },
      }));

      if (userPosition) {
        setUserPosition((prev) =>
          prev ? calculatePosition(prev.collateralAmount, prev.suppliedAmount, prev.borrowedAmount + amount) : null
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const repayUsdc = async (amount: bigint) => {
    setIsLoading(true);
    try {
      setMarket((prev) => ({
        ...prev,
        state: {
          ...prev.state,
          totalBorrowed: prev.state.totalBorrowed - amount,
        },
      }));

      if (userPosition) {
        setUserPosition((prev) =>
          prev ? calculatePosition(prev.collateralAmount, prev.suppliedAmount, prev.borrowedAmount - amount) : null
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const liquidatePosition = async (borrower: string, repayAmount: bigint) => {
    setIsLoading(true);
    try {
      // Execute liquidation logic
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LumenLendContext.Provider
      value={{
        market,
        userPosition,
        protocolStats,
        isLoading,
        supplyUsdc,
        withdrawUsdc,
        depositXlmCollateral,
        withdrawXlmCollateral,
        borrowUsdc,
        repayUsdc,
        liquidatePosition,
        refresh,
      }}
    >
      {children}
    </LumenLendContext.Provider>
  );
};

export const useLumenLend = () => {
  const ctx = useContext(LumenLendContext);
  if (!ctx) throw new Error('useLumenLend must be used within a LumenLendProvider');
  return ctx;
};
