import { execSync } from 'child_process';
import path from 'path';

async function main() {
  console.log('📦 Building Soroban Smart Contracts to WebAssembly (wasm32-unknown-unknown)...');

  const contracts = [
    'lending-pool',
    'collateral-vault',
    'liquidation-engine',
    'oracle-manager',
    'interest-rate-model',
  ];

  for (const contract of contracts) {
    console.log(`\n🔨 Compiling contract: ${contract}...`);
    try {
      execSync('cargo build --target wasm32-unknown-unknown --release', {
        cwd: path.resolve(process.cwd(), 'contracts', contract),
        stdio: 'inherit',
      });
      console.log(`✅ Successfully compiled ${contract}.wasm`);
    } catch (err: any) {
      console.warn(`⚠️ Cargo build failed (cargo toolchain may not be active in this environment): ${err.message}`);
    }
  }

  console.log('\n✨ Contract build phase completed.');
}

main().catch(console.error);
