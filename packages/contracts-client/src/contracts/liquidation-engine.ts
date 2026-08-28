import { Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import type { StellarRpcClient, StellarTransactionService, WalletConnector } from '@lumenlend/stellar';
import type { ContractTransactionResult } from '../types.js';

export class LiquidationEngineClient {
  constructor(
    public readonly contractId: string,
    private readonly rpcClient: StellarRpcClient,
    private readonly txService: StellarTransactionService
  ) {}

  async liquidate(
    liquidatorAddress: string,
    borrowerAddress: string,
    repayAmount: bigint,
    wallet: WalletConnector
  ): Promise<ContractTransactionResult> {
    const args = [
      new Address(liquidatorAddress).toScVal(),
      new Address(borrowerAddress).toScVal(),
      nativeToScVal(repayAmount, { type: 'i128' }),
    ];

    const tx = await this.txService.buildContractCall({
      contractId: this.contractId,
      method: 'liquidate',
      args,
      sourceAddress: liquidatorAddress,
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

  async isLiquidatable(borrowerAddress: string, viewerAddress: string): Promise<boolean> {
    const result = await this.txService.simulateReadCall({
      contractId: this.contractId,
      method: 'is_liquidatable',
      args: [new Address(borrowerAddress).toScVal()],
      sourceAddress: viewerAddress,
    });
    return Boolean(result);
  }
}
