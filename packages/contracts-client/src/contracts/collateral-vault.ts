import { Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import type { StellarRpcClient, StellarTransactionService, WalletConnector } from '@lumenlend/stellar';
import type { ContractTransactionResult } from '../types.js';

export class CollateralVaultClient {
  constructor(
    public readonly contractId: string,
    private readonly rpcClient: StellarRpcClient,
    private readonly txService: StellarTransactionService
  ) {}

  async depositCollateral(
    userAddress: string,
    amount: bigint,
    wallet: WalletConnector
  ): Promise<ContractTransactionResult> {
    const args = [
      new Address(userAddress).toScVal(),
      nativeToScVal(amount, { type: 'i128' }),
    ];

    const tx = await this.txService.buildContractCall({
      contractId: this.contractId,
      method: 'deposit_collateral',
      args,
      sourceAddress: userAddress,
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

  async withdrawCollateral(
    userAddress: string,
    amount: bigint,
    wallet: WalletConnector
  ): Promise<ContractTransactionResult> {
    const args = [
      new Address(userAddress).toScVal(),
      nativeToScVal(amount, { type: 'i128' }),
    ];

    const tx = await this.txService.buildContractCall({
      contractId: this.contractId,
      method: 'withdraw_collateral',
      args,
      sourceAddress: userAddress,
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
}
