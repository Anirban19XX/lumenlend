import type { StellarNetworkName } from '../network/config.js';

export type WalletType = 'freighter' | 'albedo' | 'xbull' | 'mock';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: StellarNetworkName;
  walletType: WalletType | null;
  error: string | null;
}

export interface WalletConnector {
  readonly type: WalletType;
  readonly name: string;
  isAvailable(): Promise<boolean>;
  connect(): Promise<{ address: string; network: StellarNetworkName }>;
  disconnect(): Promise<void>;
  getAddress(): Promise<string | null>;
  getNetwork(): Promise<StellarNetworkName>;
  signTransaction(
    xdr: string,
    opts?: { networkPassphrase?: string; accountToSign?: string }
  ): Promise<string>;
}
