import React, { createContext, useContext, ReactNode, useEffect } from 'react';
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
  disconnect: () => Promise<void>;
  switchToBase: () => Promise<void>;
  autoConnect: () => Promise<void>;
  checkWalletAvailability: () => boolean;
  showWalletConnectModal: boolean;
  setShowWalletConnectModal: (show: boolean) => void;
  dismissWalletNotDetected: () => void;
  walletConnectUri: string | null;
  clearError: () => void;
  isOnBaseNetwork: boolean;
}

const Web3WalletContext = createContext<Web3WalletContextValue | undefined>(undefined);

export function Web3WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWeb3Wallet();

  // Auto-connect on mount
  useEffect(() => {
    wallet.autoConnect();
  }, []);

  return (
    <Web3WalletContext.Provider value={wallet}>
      {children}
    </Web3WalletContext.Provider>
  );
}

export function useWeb3WalletContext() {
  const context = useContext(Web3WalletContext);
  if (context === undefined) {
    throw new Error('useWeb3WalletContext must be used within a Web3WalletProvider');
  }
  return context;
}
