import {
  getAddress as freighterGetAddress,
  getNetworkDetails,
  isConnected,
  isAllowed,
  setAllowed,
  signTransaction as freighterSignTx,
} from '@stellar/freighter-api';
import type { StellarNetworkName } from '../network/config.js';
import type { WalletConnector, WalletType } from './types.js';

export class FreighterConnector implements WalletConnector {
  public readonly type: WalletType = 'freighter';
  public readonly name: string = 'Freighter';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await isConnected();
      return !!res?.isConnected;
    } catch {
      return false;
    }
  }

  async connect(): Promise<{ address: string; network: StellarNetworkName }> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('Freighter extension not found or not connected.');
    }

    const allowed = await isAllowed();
    if (!allowed?.isAllowed) {
      await setAllowed();
    }

    const address = await this.getAddress();
    if (!address) {
      throw new Error('Failed to retrieve account address from Freighter.');
    }

    const network = await this.getNetwork();
    return { address, network };
  }

  async disconnect(): Promise<void> {
    // Freighter doesn't maintain persistent disconnect state; UI manages session.
  }

  async getAddress(): Promise<string | null> {
    try {
      const result = await freighterGetAddress();
      return result?.address || null;
    } catch {
      return null;
    }
  }

  async getNetwork(): Promise<StellarNetworkName> {
    try {
      const details = await getNetworkDetails();
      const network = details?.network?.toLowerCase();
      if (network?.includes('future')) return 'futurenet';
      if (network?.includes('public') || network?.includes('main')) return 'mainnet';
      if (network?.includes('stand')) return 'standalone';
      return 'testnet';
    } catch {
      return 'testnet';
    }
  }

  async signTransaction(
    xdr: string,
    opts?: { networkPassphrase?: string; accountToSign?: string }
  ): Promise<string> {
    const res = await freighterSignTx(xdr, {
      networkPassphrase: opts?.networkPassphrase,
      address: opts?.accountToSign,
    });
    if (!res?.signedTxXdr) {
      throw new Error('User declined transaction or signing failed.');
    }
    return res.signedTxXdr;
  }
}

