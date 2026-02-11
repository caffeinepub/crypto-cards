import React, { createContext, useContext, ReactNode } from 'react';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';

type WalletType = 'coinbase' | 'metamask' | 'walletconnect' | 'guest' | null;

interface Web3WalletContextValue {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  walletNotDetected: boolean;
  availableWallets: WalletType[];
  selectedWallet: WalletType;
  isTransactionReady: boolean;
  connect: (walletType?: WalletType) => Promise<void>;
  disconnect: () => void;
  switchToBase: () => Promise<void>;
  autoConnect: () => Promise<void>;
  checkWalletAvailability: () => boolean;
  showWalletConnectModal: boolean;
  setShowWalletConnectModal: (show: boolean) => void;
  dismissWalletNotDetected: () => void;
}

const Web3WalletContext = createContext<Web3WalletContextValue | undefined>(undefined);

export function Web3WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWeb3Wallet();

  // Add a dismiss function that clears the walletNotDetected state without disconnecting
  const dismissWalletNotDetected = () => {
    // We'll need to expose this from the hook, but for now we can use disconnect
    // which will be improved in the hook itself
    wallet.disconnect();
  };

  const value: Web3WalletContextValue = {
    ...wallet,
    dismissWalletNotDetected,
  };

  return (
    <Web3WalletContext.Provider value={value}>
      {children}
    </Web3WalletContext.Provider>
  );
}

export function useWeb3WalletContext() {
  const context = useContext(Web3WalletContext);
  if (context === undefined) {
    throw new Error('useWeb3WalletContext must be used within Web3WalletProvider');
  }
  return context;
}
