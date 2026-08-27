import { describe, expect, it } from 'vitest';
import { LumenLendClient } from '../src/index.js';

describe('Contracts Client Module', () => {
  it('instantiates LumenLendClient with contract addresses', () => {
    const client = new LumenLendClient({
      network: 'testnet',
      contracts: {
        lendingPool: 'CBLENDINGPOOLPLACEHOLDER',
        collateralVault: 'CBCOLLATERALVAULTPLACEHOLDER',
        liquidationEngine: 'CBLIQUIDATIONENGINEPLACEHOLDER',
        oracleManager: 'CBORACLEMANAGERPLACEHOLDER',
        interestRateModel: 'CBINTERESTRATEMODELPLACEHOLDER',
      },
    });

    expect(client.lendingPool.contractId).toBe('CBLENDINGPOOLPLACEHOLDER');
    expect(client.collateralVault.contractId).toBe('CBCOLLATERALVAULTPLACEHOLDER');
    expect(client.liquidationEngine.contractId).toBe('CBLIQUIDATIONENGINEPLACEHOLDER');
  });
});
