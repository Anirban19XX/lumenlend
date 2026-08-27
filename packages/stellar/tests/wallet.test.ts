import { describe, expect, it } from 'vitest';
import { FreighterConnector, getNetworkConfig } from '../src/index.js';

describe('Stellar Module', () => {
  it('loads testnet network configuration correctly', () => {
    const config = getNetworkConfig('testnet');
    expect(config.name).toBe('testnet');
    expect(config.rpcUrl).toContain('soroban-testnet.stellar.org');
    expect(config.passphrase).toBe('Test SDF Network ; September 2015');
  });

  it('initializes FreighterConnector adapter', () => {
    const connector = new FreighterConnector();
    expect(connector.type).toBe('freighter');
    expect(connector.name).toBe('Freighter');
  });
});
