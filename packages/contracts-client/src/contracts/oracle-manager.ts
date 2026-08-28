import { Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import type { StellarRpcClient, StellarTransactionService, WalletConnector } from '@lumenlend/stellar';
import type { ContractTransactionResult } from '../types.js';

export class OracleManagerClient {
  constructor(
    public readonly contractId: string,
    private readonly rpcClient: StellarRpcClient,
    private readonly txService: StellarTransactionService
  ) {}

  async setPrice(
    adminAddress: string,
    assetAddress: string,
    price: bigint,
    decimals: number,
    wallet: WalletConnector
  ): Promise<ContractTransactionResult> {
    const args = [
      new Address(assetAddress).toScVal(),
      nativeToScVal(price, { type: 'i128' }),
      nativeToScVal(decimals, { type: 'u32' }),
    ];

    const tx = await this.txService.buildContractCall({
      contractId: this.contractId,
      method: 'set_price',
      args,
      sourceAddress: adminAddress,
    });

    const signedXdr = await wallet.signTransaction(tx.toXDR());
    const sendRes = await this.rpcClient.sendTransaction(xdr.TransactionEnvelope.fromXDR(signedXdr, 'base64') as any);
    const txResult = await this.txService.waitForTransaction(sendRes.hash);

    return {
      txHash: sendRes.hash,
      status: txResult.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      returnValue: (txResult as any).returnValue ? scValToNative((txResult as any).returnValue) : undefined,
    };
  }

  async getPrice(assetAddress: string, viewerAddress: string): Promise<bigint> {
    const result = await this.txService.simulateReadCall({
      contractId: this.contractId,
      method: 'get_price',
      args: [new Address(assetAddress).toScVal()],
      sourceAddress: viewerAddress,
    });
    return BigInt(result as any);
  }
}
