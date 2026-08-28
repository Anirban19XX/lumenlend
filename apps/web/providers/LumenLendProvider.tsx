'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { LumenLendClient, type TransactionLifecycleStatus, type TransactionStatusCallback } from '@lumenlend/contracts-client';
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
import { ADMIN_ADDRESS, CONTRACT_ADDRESSES, STELLAR_NETWORK, STELLAR_RPC_URL } from '../lib/constants';

// Single-asset market: collateral and borrow/supply asset are both native XLM.
const XLM = CONTRACT_ADDRESSES.xlm;
const XLM_DECIMALS = 7;

const marketConfig = {
  ...DEFAULT_XLM_USDC_MARKET_CONFIG,
  marketId: 'XLM-XLM-V1',
  borrowAsset: DEFAULT_XLM_USDC_MARKET_CONFIG.collateralAsset,
};

interface LumenLendContextType {
  market: Market;
  userPosition: UserPosition | null;
  protocolStats: ProtocolStats;
  isLoading: boolean;
  transactionStatus: TransactionLifecycleStatus | null;
  transactionError: string | null;
  clearTransactionStatus: () => void;
  isAdmin: boolean;
  supplyUsdc: (amount: bigint) => Promise<void>;
  withdrawUsdc: (amount: bigint) => Promise<void>;
  depositXlmCollateral: (amount: bigint) => Promise<void>;
  withdrawXlmCollateral: (amount: bigint) => Promise<void>;
  borrowUsdc: (amount: bigint) => Promise<void>;
  repayUsdc: (amount: bigint) => Promise<void>;
  liquidatePosition: (borrower: string, repayAmount: bigint) => Promise<void>;
  setLiquidationThresholdBps: (newBps: number) => Promise<void>;
  checkLiquidatable: (borrower: string) => Promise<{
    isLiquidatable: boolean;
    healthFactorBps: number;
    debt: bigint;
    collateral: bigint;
  }>;
  refresh: () => Promise<void>;
}

const emptyMarket: Market = {
  config: marketConfig,
  state: {
    marketId: marketConfig.marketId,
    totalSupply: 0n,
    totalBorrowed: 0n,
    totalReserves: 0n,
    utilizationBps: 0,
    borrowApyBps: marketConfig.baseRateBps,
    supplyApyBps: 0,
    collateralPriceUsd: 0n,
    borrowPriceUsd: 0n,
    lastUpdatedTimestamp: 0,
  },
};

const emptyStats: ProtocolStats = {
  totalValueLockedUsd: 0n,
  totalSuppliedUsd: 0n,
  totalBorrowedUsd: 0n,
  totalCollateralUsd: 0n,
  totalReservesUsd: 0n,
  activeUsersCount: 0,
  marketsCount: 1,
};

const LumenLendContext = createContext<LumenLendContextType | undefined>(undefined);

export const LumenLendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, address, connector } = useWallet();
  const [market, setMarket] = useState<Market>(emptyMarket);
  const [protocolStats, setProtocolStats] = useState<ProtocolStats>(emptyStats);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionLifecycleStatus | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const client = useMemo(
    () =>
      new LumenLendClient({
        network: STELLAR_NETWORK,
        rpcUrl: STELLAR_RPC_URL,
        contracts: CONTRACT_ADDRESSES,
      }),
    []
  );

  // Reads need a real existing account to build the simulated tx envelope; fall back to
  // the protocol admin address before a wallet is connected.
  const viewerAddress = address || ADMIN_ADDRESS;
  const isAdmin = Boolean(address && ADMIN_ADDRESS && address === ADMIN_ADDRESS);

  const refresh = useCallback(async () => {
    if (!viewerAddress) return;
    setIsLoading(true);
    try {
      const [marketStateRaw, price] = await Promise.all([
        client.lendingPool.getMarketState(XLM, viewerAddress),
        client.oracleManager.getPrice(XLM, viewerAddress),
      ]);

      const totalSupply = BigInt(marketStateRaw?.total_supplied ?? 0);
      const totalBorrowed = BigInt(marketStateRaw?.total_borrowed ?? 0);
      const totalReserves = BigInt(marketStateRaw?.total_reserves ?? 0);
      const utilizationBps = calculateUtilization(totalBorrowed, totalSupply);
      const borrowApyBps = calculateBorrowRate(utilizationBps, marketConfig);
      const supplyApyBps = calculateSupplyRate(borrowApyBps, utilizationBps, marketConfig.reserveFactorBps);

      const nextMarket: Market = {
        config: marketConfig,
        state: {
          marketId: marketConfig.marketId,
          totalSupply,
          totalBorrowed,
          totalReserves,
          utilizationBps,
          borrowApyBps,
          supplyApyBps,
          collateralPriceUsd: price,
          borrowPriceUsd: price,
          lastUpdatedTimestamp: Date.now(),
        },
      };
      setMarket(nextMarket);

      const totalSuppliedUsd = tokenAmountToUsd(totalSupply, XLM_DECIMALS, price);
      const totalBorrowedUsd = tokenAmountToUsd(totalBorrowed, XLM_DECIMALS, price);
      setProtocolStats({
        totalValueLockedUsd: totalSuppliedUsd,
        totalSuppliedUsd,
        totalBorrowedUsd,
        totalCollateralUsd: totalSuppliedUsd,
        totalReservesUsd: tokenAmountToUsd(totalReserves, XLM_DECIMALS, price),
        activeUsersCount: 0,
        marketsCount: 1,
      });

      if (isConnected && address) {
        const [userPosRaw, collateral] = await Promise.all([
          client.lendingPool.getUserPosition(address, XLM, viewerAddress),
          client.collateralVault.getCollateral(address, viewerAddress),
        ]);

        const suppliedAmount = BigInt(userPosRaw?.supplied_shares ?? 0);
        const borrowedAmount = BigInt(userPosRaw?.principal_borrowed ?? 0);
        const collateralValueUsd = tokenAmountToUsd(collateral, XLM_DECIMALS, price);
        const borrowedValueUsd = tokenAmountToUsd(borrowedAmount, XLM_DECIMALS, price);
        const borrowCapacityUsd = calculateBorrowCapacity(collateralValueUsd, marketConfig.maxLtvBps);
        const availableToBorrowUsd = borrowCapacityUsd > borrowedValueUsd ? borrowCapacityUsd - borrowedValueUsd : 0n;
        const hf = calculateHealthFactor(collateralValueUsd, borrowedValueUsd, marketConfig.liquidationThresholdBps);

        setUserPosition({
          userAddress: address,
          marketId: marketConfig.marketId,
          suppliedAmount,
          borrowedAmount,
          collateralAmount: collateral,
          collateralValueUsd,
          borrowedValueUsd,
          borrowCapacityUsd,
          availableToBorrowUsd,
          healthFactorBps: hf.basisPoints,
          healthFactorStatus: hf.status,
          isLiquidatable: hf.status === 'liquidatable',
          lastUpdated: Date.now(),
        });
      } else {
        setUserPosition(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [client, viewerAddress, isConnected, address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const withWallet = useCallback(
    async (action: (onStatus: TransactionStatusCallback) => Promise<unknown>) => {
      if (!address || !connector) throw new Error('Wallet not connected');
      setIsLoading(true);
      setTransactionError(null);
      setTransactionStatus('preparing');
      try {
        const result = await action(setTransactionStatus);
        if ((result as { status?: string } | undefined)?.status === 'FAILED') {
          setTransactionStatus('failed');
          setTransactionError('The transaction was not successful.');
          return;
        }
        setTransactionStatus('successful');
        await refresh();
      } catch (err: unknown) {
        setTransactionStatus('failed');
        setTransactionError(err instanceof Error ? err.message : 'The transaction failed.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, connector, refresh]
  );

  const supplyUsdc = (amount: bigint) =>
    withWallet((onStatus) => client.lendingPool.supply(address!, XLM, amount, connector!, onStatus));
  const withdrawUsdc = (amount: bigint) =>
    withWallet((onStatus) => client.lendingPool.withdraw(address!, XLM, amount, connector!, onStatus));
  const borrowUsdc = (amount: bigint) =>
    withWallet((onStatus) => client.lendingPool.borrow(address!, XLM, amount, connector!, onStatus));
  const repayUsdc = (amount: bigint) =>
    withWallet((onStatus) => client.lendingPool.repay(address!, XLM, amount, connector!, onStatus));
  const depositXlmCollateral = (amount: bigint) =>
    withWallet((onStatus) => client.collateralVault.depositCollateral(address!, amount, connector!, onStatus));
  const withdrawXlmCollateral = (amount: bigint) =>
    withWallet((onStatus) => client.collateralVault.withdrawCollateral(address!, amount, connector!, onStatus));
  const liquidatePosition = (borrower: string, repayAmount: bigint) =>
    withWallet(() => client.liquidationEngine.liquidate(address!, borrower, repayAmount, connector!));
  const setLiquidationThresholdBps = (newBps: number) =>
    withWallet(() => client.collateralVault.setLiquidationThreshold(address!, newBps, connector!));

  const clearTransactionStatus = useCallback(() => {
    setTransactionStatus(null);
    setTransactionError(null);
  }, []);

  const checkLiquidatable = useCallback(
    async (borrower: string) => {
      const [liquidatable, healthFactor, position, collateral] = await Promise.all([
        client.liquidationEngine.isLiquidatable(borrower, viewerAddress),
        client.collateralVault.getHealthFactor(borrower, viewerAddress),
        client.lendingPool.getUserPosition(borrower, XLM, viewerAddress),
        client.collateralVault.getCollateral(borrower, viewerAddress),
      ]);
      return {
        isLiquidatable: liquidatable,
        healthFactorBps: Number(healthFactor > 999_999n ? 999_999n : healthFactor),
        debt: BigInt(position?.principal_borrowed ?? 0),
        collateral,
      };
    },
    [client, viewerAddress]
  );

  return (
    <LumenLendContext.Provider
      value={{
        market,
        userPosition,
        protocolStats,
        isLoading,
        transactionStatus,
        transactionError,
        clearTransactionStatus,
        isAdmin,
        supplyUsdc,
        withdrawUsdc,
        depositXlmCollateral,
        withdrawXlmCollateral,
        borrowUsdc,
        repayUsdc,
        liquidatePosition,
        setLiquidationThresholdBps,
        checkLiquidatable,
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
