import { Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import type { StellarRpcClient, StellarTransactionService, WalletConnector } from '@lumenlend/stellar';
import type { ContractTransactionResult, TransactionStatusCallback } from '../types.js';

export class CollateralVaultClient {
  constructor(
    public readonly contractId: string,
    private readonly rpcClient: StellarRpcClient,
    private readonly txService: StellarTransactionService
  ) {}

  async depositCollateral(
    userAddress: string,
    amount: bigint,
    wallet: WalletConnector,
    onStatus?: TransactionStatusCallback
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

    onStatus?.('awaitingApproval');
    const signedXdr = await wallet.signTransaction(tx.toXDR());
    const sendRes = await this.rpcClient.sendTransaction(xdr.TransactionEnvelope.fromXDR(signedXdr, 'base64') as any);
    onStatus?.('submitted');
    onStatus?.('confirming');
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
    wallet: WalletConnector,
    onStatus?: TransactionStatusCallback
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

    onStatus?.('awaitingApproval');
    const signedXdr = await wallet.signTransaction(tx.toXDR());
    const sendRes = await this.rpcClient.sendTransaction(xdr.TransactionEnvelope.fromXDR(signedXdr, 'base64') as any);
    onStatus?.('submitted');
    onStatus?.('confirming');
    const txResult = await this.txService.waitForTransaction(sendRes.hash);

    return {
      txHash: sendRes.hash,
      status: txResult.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      returnValue: (txResult as any).returnValue ? scValToNative((txResult as any).returnValue) : undefined,
    };
  }

  async setLiquidationThreshold(
    adminAddress: string,
    newBps: number,
    wallet: WalletConnector
  ): Promise<ContractTransactionResult> {
    const args = [new Address(adminAddress).toScVal(), nativeToScVal(newBps, { type: 'u32' })];

    const tx = await this.txService.buildContractCall({
      contractId: this.contractId,
      method: 'set_liquidation_threshold',
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

  async getCollateral(userAddress: string, viewerAddress: string): Promise<bigint> {
    const result = await this.txService.simulateReadCall({
      contractId: this.contractId,
      method: 'get_collateral',
      args: [new Address(userAddress).toScVal()],
      sourceAddress: viewerAddress,
    });
    return BigInt(result as any);
  }

  async getHealthFactor(userAddress: string, viewerAddress: string): Promise<bigint> {
    const result = await this.txService.simulateReadCall({
      contractId: this.contractId,
      method: 'get_health_factor',
      args: [new Address(userAddress).toScVal()],
      sourceAddress: viewerAddress,
    });
    return BigInt(result as any);
  }
}
