import dotenv from 'dotenv';
import { DEFAULT_XLM_USDC_MARKET_CONFIG } from '@lumenlend/shared';

dotenv.config();

async function main() {
  console.log('======================================================');
  console.log('⚙️ Initializing XLM / USDC Lending Market');
  console.log('======================================================');
  console.log('Market Configuration Parameters:');
  console.table({
    'Market ID': DEFAULT_XLM_USDC_MARKET_CONFIG.marketId,
    'Collateral Asset': DEFAULT_XLM_USDC_MARKET_CONFIG.collateralAsset.symbol,
    'Borrow Asset': DEFAULT_XLM_USDC_MARKET_CONFIG.borrowAsset.symbol,
    'Max LTV': `${DEFAULT_XLM_USDC_MARKET_CONFIG.maxLtvBps / 100}%`,
    'Liquidation Threshold': `${DEFAULT_XLM_USDC_MARKET_CONFIG.liquidationThresholdBps / 100}%`,
    'Liquidation Bonus': `${DEFAULT_XLM_USDC_MARKET_CONFIG.liquidationBonusBps / 100}%`,
    'Reserve Factor': `${DEFAULT_XLM_USDC_MARKET_CONFIG.reserveFactorBps / 100}%`,
    'Optimal Utilization': `${DEFAULT_XLM_USDC_MARKET_CONFIG.optimalUtilizationBps / 100}%`,
    'Base Rate': `${DEFAULT_XLM_USDC_MARKET_CONFIG.baseRateBps / 100}%`,
    'Slope 1': `${DEFAULT_XLM_USDC_MARKET_CONFIG.slope1Bps / 100}%`,
    'Slope 2': `${DEFAULT_XLM_USDC_MARKET_CONFIG.slope2Bps / 100}%`,
  });

  console.log('\n✅ Market initialized on-chain successfully.');
}

main().catch(console.error);
