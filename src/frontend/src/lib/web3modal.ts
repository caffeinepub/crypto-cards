// WalletConnect configuration placeholder
// Since @web3modal/ethers is not available in package.json, we'll handle WalletConnect
// through a custom modal implementation

export const BASE_CHAIN_ID = 8453;

export const baseMainnet = {
  chainId: 8453,
  name: 'Base',
  currency: 'ETH',
  explorerUrl: 'https://basescan.org',
  rpcUrl: 'https://mainnet.base.org'
};

export const metadata = {
  name: 'Crypto Cards',
  description: 'Play Spades and Pot Limit Omaha with crypto',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://cryptocards.app',
  icons: ['/assets/generated/wallet-icon-transparent.dim_64x64.png']
};

// Placeholder for future Web3Modal integration
export const web3Modal = null;
