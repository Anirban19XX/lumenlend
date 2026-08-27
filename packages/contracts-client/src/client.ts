import { StellarRpcClient, StellarTransactionService, type StellarNetworkName } from '@lumenlend/stellar';
import { CollateralVaultClient } from './contracts/collateral-vault.js';
import { InterestRateModelClient } from './contracts/interest-rate-model.js';
import { LendingPoolClient } from './contracts/lending-pool.js';
import { LiquidationEngineClient } from './contracts/liquidation-engine.js';
import { OracleManagerClient } from './contracts/oracle-manager.js';
import type { ClientConfig, ProtocolContractAddresses } from './types.js';

export class LumenLendClient {
  public readonly rpc: StellarRpcClient;
  public readonly txService: StellarTransactionService;
  public readonly contracts: ProtocolContractAddresses;

  public readonly lendingPool: LendingPoolClient;
  public readonly collateralVault: CollateralVaultClient;
  public readonly liquidationEngine: LiquidationEngineClient;
  public readonly oracleManager: OracleManagerClient;
  public readonly interestRateModel: InterestRateModelClient;

  constructor(config: ClientConfig) {
    this.contracts = config.contracts;
    this.rpc = new StellarRpcClient(config.network, config.rpcUrl);
    this.txService = new StellarTransactionService(this.rpc, config.network);

    this.lendingPool = new LendingPoolClient(config.contracts.lendingPool, this.rpc, this.txService);
    this.collateralVault = new CollateralVaultClient(config.contracts.collateralVault, this.rpc, this.txService);
    this.liquidationEngine = new LiquidationEngineClient(config.contracts.liquidationEngine, this.rpc, this.txService);
    this.oracleManager = new OracleManagerClient(config.contracts.oracleManager, this.rpc, this.txService);
    this.interestRateModel = new InterestRateModelClient(config.contracts.interestRateModel, this.rpc, this.txService);
  }
}
