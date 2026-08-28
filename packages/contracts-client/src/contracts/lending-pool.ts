import { Address, nativeToScVal, scValToNative, xdr } from '@stellar/stellar-sdk';
import type { StellarRpcClient, StellarTransactionService, WalletConnector } from '@lumenlend/stellar';
import type { ContractTransactionResult } from '../types.js';

export class LendingPoolClient {
  constructor(
    public readonly contractId: string,
    private readonly rpcClient: StellarRpcClient,
    private readonly txService: StellarTransactionService
  ) {}

  async supply(
    userAddress: string,
    assetAddress: string,
    amount: bigint,
    wallet: WalletConnector
  ): Promise<ContractTransactionResult> {
    const args = [
      new Address(userAddress).toScVal(),
      new Address(assetAddress).toScVal(),
      nativeToScVal(amount, { type: 'i128' }),
    ];

    const tx = await this.txService.buildContractCall({
      contractId: this.contractId,
      method: 'supply',
      args,
      sourceAddress: userAddress,
    });

    const signedXdr = await wallet.signTransaction(tx.toXDR());
    const sendRes = await this.rpcClient.sendTransaction(xdr.TransactionEnvelope.fromXDR(signedXdr, 'base64') as any);

    if (sendRes.status === 'ERROR') {
      throw new Error(`Failed to send supply transaction: ${JSON.stringify(sendRes.errorResult)}`);
    }

    const txResult = await this.txService.waitForTransaction(sendRes.hash);
    return {
      txHash: sendRes.hash,
      status: txResult.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      returnValue: (txResult as any).returnValue ? scValToNative((txResult as any).returnValue) : undefined,
    };
  }

  async withdraw(
    userAddress: string,
    assetAddress: string,
    amount: bigint,
    wallet: WalletConnector
  ): Promise<ContractTransactionResult> {
    const args = [
      new Address(userAddress).toScVal(),
      new Address(assetAddress).toScVal(),
      nativeToScVal(amount, { type: 'i128' }),
    ];

    const tx = await this.txService.buildContractCall({
      contractId: this.contractId,
      method: 'withdraw',
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

  async borrow(
    userAddress: string,
    assetAddress: string,
    amount: bigint,
    wallet: WalletConnector
  ): Promise<ContractTransactionResult> {
    const args = [
      new Address(userAddress).toScVal(),
      new Address(assetAddress).toScVal(),
      nativeToScVal(amount, { type: 'i128' }),
    ];

    const tx = await this.txService.buildContractCall({
      contractId: this.contractId,
      method: 'borrow',
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

  async repay(
    userAddress: string,
    assetAddress: string,
    amount: bigint,
    wallet: WalletConnector
  ): Promise<ContractTransactionResult> {
    const args = [
      new Address(userAddress).toScVal(),
      new Address(assetAddress).toScVal(),
      nativeToScVal(amount, { type: 'i128' }),
    ];

    const tx = await this.txService.buildContractCall({
      contractId: this.contractId,
      method: 'repay',
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

  async getMarketState(assetAddress: string, viewerAddress: string): Promise<any> {
    return this.txService.simulateReadCall({
      contractId: this.contractId,
      method: 'get_market_state',
      args: [new Address(assetAddress).toScVal()],
      sourceAddress: viewerAddress,
    });
  }

  async getUserPosition(userAddress: string, assetAddress: string, viewerAddress: string): Promise<any> {
    return this.txService.simulateReadCall({
      contractId: this.contractId,
      method: 'get_user_position',
      args: [new Address(userAddress).toScVal(), new Address(assetAddress).toScVal()],
      sourceAddress: viewerAddress,
    });
  }
}
