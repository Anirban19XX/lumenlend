import { DEFAULT_XLM_USDC_MARKET_CONFIG } from '@lumenlend/shared';

export function setupTestEnvironment() {
  return {
    marketConfig: DEFAULT_XLM_USDC_MARKET_CONFIG,
    network: 'testnet',
    testAccount: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  };
}
