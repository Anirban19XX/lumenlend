import { describe, expect, it } from 'vitest';
import { healthFactorService } from '../src/services/health-factor.service.js';
import { positionService } from '../src/services/position.service.js';

describe('Indexer Services', () => {
  it('computes health factor properly', () => {
    // $1000 collateral, $500 debt, 80% threshold -> HF = 1.6
    const hf = healthFactorService.computeHealthFactor(
      1000_000_000_000n,
      500_000_000_000n,
      8000
    );
    expect(hf.status).toBe('safe');
    expect(hf.score).toBe(1.6);
  });

  it('retrieves default position state gracefully', async () => {
    const pos = await positionService.getPosition('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
    expect(pos.userAddress).toBe('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
    expect(pos.marketId).toBe('XLM-USDC-V1');
  });
});
