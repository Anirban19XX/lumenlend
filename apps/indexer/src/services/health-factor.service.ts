import { calculateHealthFactor } from '@lumenlend/shared';
import type { HealthFactor } from '@lumenlend/shared';

export class HealthFactorService {
  computeHealthFactor(
    collateralValueUsd: bigint,
    borrowedValueUsd: bigint,
    liquidationThresholdBps: number = 8000
  ): HealthFactor {
    return calculateHealthFactor(collateralValueUsd, borrowedValueUsd, liquidationThresholdBps);
  }
}

export const healthFactorService = new HealthFactorService();
