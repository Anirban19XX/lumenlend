export type StellarNetworkName = 'testnet' | 'futurenet' | 'standalone' | 'mainnet';

export interface StellarNetworkConfig {
  name: StellarNetworkName;
  rpcUrl: string;
  horizonUrl: string;
  passphrase: string;
}

export const NETWORKS: Record<StellarNetworkName, StellarNetworkConfig> = {
  testnet: {
    name: 'testnet',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
  },
  futurenet: {
    name: 'futurenet',
    rpcUrl: 'https://rpc-futurenet.stellar.org',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    passphrase: 'Test SDF Future Network ; October 2022',
  },
  standalone: {
    name: 'standalone',
    rpcUrl: 'http://localhost:8000/soroban/rpc',
    horizonUrl: 'http://localhost:8000',
    passphrase: 'Standalone Network ; February 2017',
  },
  mainnet: {
    name: 'mainnet',
    rpcUrl: 'https://mainnet.sorobanrpc.com',
    horizonUrl: 'https://horizon.stellar.org',
    passphrase: 'Public Global Stellar Network ; September 2015',
  },
};

export function getNetworkConfig(name: StellarNetworkName = 'testnet'): StellarNetworkConfig {
  return NETWORKS[name] || NETWORKS.testnet;
}
