import { rpc } from '@stellar/stellar-sdk';
import { getNetworkConfig, type StellarNetworkName } from '../network/config.js';

export class StellarRpcClient {
  public readonly server: rpc.Server;
  public readonly network: StellarNetworkName;

  constructor(network: StellarNetworkName = 'testnet', customRpcUrl?: string) {
    this.network = network;
    const config = getNetworkConfig(network);
    this.server = new rpc.Server(customRpcUrl || config.rpcUrl);
  }

  async getLatestLedger(): Promise<rpc.Api.GetLatestLedgerResponse> {
    return this.server.getLatestLedger();
  }

  async getHealth(): Promise<rpc.Api.GetHealthResponse> {
    return this.server.getHealth();
  }

  async getAccount(address: string): Promise<ReturnType<rpc.Server['getAccount']>> {
    return this.server.getAccount(address);
  }

  async simulateTransaction(tx: Parameters<rpc.Server['simulateTransaction']>[0]): Promise<rpc.Api.SimulateTransactionResponse> {
    return this.server.simulateTransaction(tx);
  }

  async sendTransaction(tx: Parameters<rpc.Server['sendTransaction']>[0]): Promise<rpc.Api.SendTransactionResponse> {
    return this.server.sendTransaction(tx);
  }

  async getTransaction(hash: string): Promise<rpc.Api.GetTransactionResponse> {
    return this.server.getTransaction(hash);
  }

  async getEvents(params: rpc.Server.GetEventsRequest): Promise<rpc.Api.GetEventsResponse> {
    return this.server.getEvents(params);
  }
}
