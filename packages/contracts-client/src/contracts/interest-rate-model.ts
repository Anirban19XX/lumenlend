import type { StellarRpcClient, StellarTransactionService } from '@lumenlend/stellar';

export class InterestRateModelClient {
  constructor(
    public readonly contractId: string,
    private readonly rpcClient: StellarRpcClient,
    private readonly txService: StellarTransactionService
  ) {}
}
