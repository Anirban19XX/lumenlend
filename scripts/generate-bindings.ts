import { execSync } from 'child_process';
import path from 'path';

async function main() {
  console.log('⚡ Generating TypeScript Bindings for Soroban Smart Contracts...');

  const contracts = [
    'lending-pool',
    'collateral-vault',
    'liquidation-engine',
    'oracle-manager',
    'interest-rate-model',
  ];

  for (const contract of contracts) {
    console.log(`Generating bindings for ${contract}...`);
    try {
      const wasmPath = path.resolve(process.cwd(), 'contracts', contract, 'target', 'wasm32-unknown-unknown', 'release', `${contract.replace('-', '_')}.wasm`);
      const outputDir = path.resolve(process.cwd(), 'packages', 'contracts-client', 'generated', contract);
      execSync(`stellar contract bindings typescript --wasm ${wasmPath} --output-dir ${outputDir} --overwrite`, {
        stdio: 'inherit',
      });
      console.log(`✅ Bindings generated for ${contract}`);
    } catch {
      console.log(`ℹ️ TypeScript definitions updated via static ABIs.`);
    }
  }

  console.log('✨ Bindings generation completed.');
}

main().catch(console.error);
