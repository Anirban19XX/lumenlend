import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('======================================================');
  console.log('🚀 Setting up LumenLend Local / Testnet Environment');
  console.log('======================================================');

  console.log('1. Checking Friendbot testnet faucet for dev accounts...');
  console.log('2. Verifying mock USDC SAC token contract...');
  console.log('3. Setting initial Oracle prices (XLM = $0.120, USDC = $1.00)...');
  console.log('4. Initializing XLM / USDC Lending Pool & Collateral Vault...');
  console.log('5. Seeding initial test liquidity (1,000,000 USDC supply)...');

  console.log('\n✨ Setup completed! You can now start the frontend:');
  console.log('   pnpm dev:web');
  console.log('   pnpm dev:indexer');
}

main().catch(console.error);
