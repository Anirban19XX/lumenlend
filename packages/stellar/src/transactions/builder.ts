import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Operation,
  TimeoutInfinite,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import { getNetworkConfig, type StellarNetworkName } from '../network/config.js';
import type { StellarRpcClient } from '../rpc/client.js';

export interface ContractCallOptions {
  contractId: string;
  method: string;
  args?: xdr.ScVal[];
  sourceAddress: string;
  network?: StellarNetworkName;
  fee?: string;
}

export class StellarTransactionService {
  constructor(
    private readonly rpcClient: StellarRpcClient,
    private readonly networkName: StellarNetworkName = 'testnet'
  ) {}

  async buildContractCall(options: ContractCallOptions) {
    const networkConfig = getNetworkConfig(this.networkName);
    const contract = new Contract(options.contractId);
    const account = await this.rpcClient.getAccount(options.sourceAddress);

    const callOp = contract.call(options.method, ...(options.args || []));

    const tx = new TransactionBuilder(account, {
      fee: options.fee || BASE_FEE,
      networkPassphrase: networkConfig.passphrase,
    })
      .addOperation(callOp)
      .setTimeout(TimeoutInfinite)
      .build();

    // Prepare transaction with simulation footprint and fees
    const preparedTx = await this.rpcClient.server.prepareTransaction(tx);
    return preparedTx;
  }

  /**
   * Read-only contract call: simulates but never signs or sends. `sourceAddress` just needs
   * to be a real existing account (no auth is performed for a pure view call).
   */
  async simulateReadCall(options: ContractCallOptions): Promise<unknown> {
    const networkConfig = getNetworkConfig(options.network || this.networkName);
    const contract = new Contract(options.contractId);
    const account = await this.rpcClient.getAccount(options.sourceAddress);

    const callOp = contract.call(options.method, ...(options.args || []));
    const tx = new TransactionBuilder(account, {
      fee: options.fee || BASE_FEE,
      networkPassphrase: networkConfig.passphrase,
    })
      .addOperation(callOp)
      .setTimeout(TimeoutInfinite)
      .build();

    const simResult = await this.rpcClient.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed for ${options.method}: ${simResult.error}`);
    }
    if (!simResult.result?.retval) {
      return undefined;
    }
    return scValToNative(simResult.result.retval);
  }

  async waitForTransaction(hash: string, timeoutMs: number = 30000): Promise<rpc.Api.GetTransactionResponse> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const res = await this.rpcClient.getTransaction(hash);
      if (res.status !== 'NOT_FOUND') {
        return res;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`Transaction ${hash} timed out after ${timeoutMs}ms`);
  }
}
