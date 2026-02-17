import { useState, useEffect, useCallback } from 'react';
import { useWalletConnect } from './useWalletConnect';
import { parseWeiToEth } from '../utils/ethFormat';

export type WalletType = 'coinbase' | 'metamask' | 'injected' | 'walletconnect' | 'guest' | null;

interface Web3Wallet {
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
  cancelWalletConnect: () => void;
  retry: () => Promise<void>;
}

// Base Mainnet Chain ID
const BASE_CHAIN_ID = 8453;

// Generate a deterministic guest wallet address based on session
function generateGuestWalletAddress(): string {
  const existingAddress = sessionStorage.getItem('guestWalletAddress');
  if (existingAddress) {
    return existingAddress;
  }

  const randomHex = Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  const guestAddress = `0x${randomHex}`;
  
  sessionStorage.setItem('guestWalletAddress', guestAddress);
  console.log('[Wallet] Generated guest wallet address:', guestAddress);
  
  return guestAddress;
}

// Check if window.ethereum is available (MetaMask, Coinbase Wallet, or other injected wallets)
function hasInjectedProvider(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
}

// Detect specific wallet type
function detectWalletType(): 'coinbase' | 'metamask' | null {
  if (typeof window === 'undefined' || !(window as any).ethereum) return null;
  
  const ethereum = (window as any).ethereum;
  
  if (ethereum.isCoinbaseWallet) return 'coinbase';
  if (ethereum.isMetaMask) return 'metamask';
  
  return null;
}

// Detect if user is on mobile device
function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function useWeb3Wallet(): Web3Wallet {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletNotDetected, setWalletNotDetected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletType>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTransactionReady, setIsTransactionReady] = useState(false);
  const [showWalletConnectModal, setShowWalletConnectModal] = useState(false);

  // WalletConnect hook
  const walletConnect = useWalletConnect();

  // Derive WalletConnect URI
  const walletConnectUri = selectedWallet === 'walletconnect' ? walletConnect.uri : null;

  // Check if on Base network
  const isOnBaseNetwork = chainId === BASE_CHAIN_ID;

  // Sync WalletConnect state
  useEffect(() => {
    if (selectedWallet === 'walletconnect') {
      // Update connecting state from WalletConnect
      if (walletConnect.isConnecting || walletConnect.isAwaitingUser) {
        setIsConnecting(true);
      } else {
        setIsConnecting(false);
      }

      // Update error from WalletConnect
      if (walletConnect.error) {
        setError(walletConnect.error);
      }

      // Update connection state
      if (walletConnect.isConnected && walletConnect.session) {
        const wcAddress = walletConnect.session.accounts[0];
        if (wcAddress && wcAddress !== address) {
          setAddress(wcAddress);
          setChainId(walletConnect.session.chainId);
          setIsTransactionReady(true);
          setShowWalletConnectModal(false);
          setError(null);
          
          // Fetch balance
          walletConnect.getBalance(wcAddress).then(bal => {
            setBalance(bal);
            console.log('[Wallet] WalletConnect balance:', bal);
          });
        }
      }
    }
  }, [
    walletConnect.isConnecting,
    walletConnect.isAwaitingUser,
    walletConnect.isConnected,
    walletConnect.session,
    walletConnect.error,
    selectedWallet,
    address,
    walletConnect
  ]);

  const fetchBalance = useCallback(async (addr: string) => {
    try {
      if (hasInjectedProvider()) {
        const ethereum = (window as any).ethereum;
        const balanceHex = await ethereum.request({
          method: 'eth_getBalance',
          params: [addr, 'latest'],
        });
        // Use BigInt-safe parsing
        const balanceValue = parseWeiToEth(balanceHex, 4);
        console.log('[Wallet] Balance fetched:', balanceValue, 'ETH');
        setBalance(balanceValue);
        return balanceValue;
      }
      return null;
    } catch (err) {
      console.error('[Wallet] Failed to fetch balance:', err);
      return null;
    }
  }, []);

  // Enhanced transaction readiness verification with multiple checks
  const verifyTransactionReadiness = useCallback(async (addr: string, retryCount = 0): Promise<boolean> => {
    try {
      if (hasInjectedProvider()) {
        const ethereum = (window as any).ethereum;
        
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          console.log('[Wallet] Transaction readiness check failed: no accounts');
          return false;
        }
        
        const accountMatch = accounts.some((acc: string) => acc.toLowerCase() === addr.toLowerCase());
        if (!accountMatch) {
          console.log('[Wallet] Transaction readiness check failed: no matching account');
          return false;
        }
        
        const currentChainId = await ethereum.request({ method: 'eth_chainId' });
        const chainIdNum = parseInt(currentChainId, 16);
        
        const balanceHex = await ethereum.request({
          method: 'eth_getBalance',
          params: [addr, 'latest'],
        });
        
        if (!balanceHex) {
          console.log('[Wallet] Transaction readiness check failed: cannot read balance');
          return false;
        }
        
        console.log('[Wallet] Transaction readiness verified:', {
          address: addr,
          chainId: chainIdNum,
          hasBalance: true,
          hasProvider: true
        });
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('[Wallet] Transaction readiness check failed:', err);
      
      // Retry logic for mobile wallets that need more time
      if (retryCount < 2) {
        console.log(`[Wallet] Retrying transaction readiness check (attempt ${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        return verifyTransactionReadiness(addr, retryCount + 1);
      }
      
      return false;
    }
  }, []);

  // Initialize provider listeners for injected wallets
  useEffect(() => {
    if (hasInjectedProvider() && selectedWallet !== 'walletconnect' && selectedWallet !== 'guest') {
      const ethereum = (window as any).ethereum;

      const handleAccountsChanged = (accounts: string[]) => {
        console.log('[Wallet] Accounts changed:', accounts);
        if (accounts.length === 0) {
          console.log('[Wallet] User disconnected wallet');
          setAddress(null);
          setBalance(null);
          setSelectedWallet(null);
          setIsTransactionReady(false);
        } else if (accounts[0] !== address) {
          console.log('[Wallet] Account switched to:', accounts[0]);
          setAddress(accounts[0]);
          fetchBalance(accounts[0]);
          verifyTransactionReadiness(accounts[0]).then(setIsTransactionReady);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        const chainIdNum = parseInt(newChainId, 16);
        console.log('[Wallet] Chain changed to:', chainIdNum);
        setChainId(chainIdNum);
        if (address) {
          fetchBalance(address);
          verifyTransactionReadiness(address).then(setIsTransactionReady);
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [address, selectedWallet, fetchBalance, verifyTransactionReadiness]);

  const clearError = useCallback(() => {
    setError(null);
    if (selectedWallet === 'walletconnect') {
      walletConnect.clearError();
    }
  }, [selectedWallet, walletConnect]);

  const checkWalletAvailability = useCallback((): boolean => {
    return hasInjectedProvider();
  }, []);

  const dismissWalletNotDetected = useCallback(() => {
    setWalletNotDetected(false);
  }, []);

  const cancelWalletConnect = useCallback(() => {
    console.log('[Wallet] Cancelling WalletConnect');
    walletConnect.cancelConnection();
    setSelectedWallet(null);
    setShowWalletConnectModal(false);
    setIsConnecting(false);
    setError(null);
  }, [walletConnect]);

  const connect = useCallback(async (walletType?: WalletType) => {
    const targetWallet = walletType || selectedWallet;
    
    if (!targetWallet) {
      console.error('[Wallet] No wallet type specified');
      return;
    }

    console.log('[Wallet] Connecting to:', targetWallet);
    setIsConnecting(true);
    setError(null);
    setSelectedWallet(targetWallet);

    try {
      if (targetWallet === 'guest') {
        const guestAddress = generateGuestWalletAddress();
        setAddress(guestAddress);
        setBalance('0.0000');
        setChainId(BASE_CHAIN_ID);
        setIsTransactionReady(false);
        setIsConnecting(false);
        console.log('[Wallet] Connected as guest:', guestAddress);
        return;
      }

      if (targetWallet === 'walletconnect') {
        setShowWalletConnectModal(true);
        await walletConnect.connect();
        // State will be synced via useEffect
        return;
      }

      // Injected wallet flow (Coinbase/MetaMask/generic injected)
      if (!hasInjectedProvider()) {
        setWalletNotDetected(true);
        setIsConnecting(false);
        setError('No wallet detected. Please install a wallet extension.');
        return;
      }

      const ethereum = (window as any).ethereum;
      
      // Request accounts
      let accounts: string[];
      try {
        accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      } catch (requestError: any) {
        // User rejected the connection request
        if (requestError.code === 4001) {
          throw new Error('Connection request rejected. Please approve the connection in your wallet.');
        }
        throw requestError;
      }
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }

      const userAddress = accounts[0];
      setAddress(userAddress);

      const currentChainId = await ethereum.request({ method: 'eth_chainId' });
      const chainIdNum = parseInt(currentChainId, 16);
      setChainId(chainIdNum);

      await fetchBalance(userAddress);
      
      const isReady = await verifyTransactionReadiness(userAddress);
      setIsTransactionReady(isReady);
      
      setIsConnecting(false);
      console.log('[Wallet] Connected successfully:', {
        address: userAddress,
        chainId: chainIdNum,
        wallet: targetWallet,
        transactionReady: isReady
      });

    } catch (err: any) {
      console.error('[Wallet] Connection failed:', err);
      const errorMessage = err.message || 'Failed to connect wallet. Please try again.';
      setError(errorMessage);
      setIsConnecting(false);
      // Don't clear selectedWallet on error so retry can work
    }
  }, [selectedWallet, fetchBalance, verifyTransactionReadiness, walletConnect]);

  const disconnect = useCallback(async () => {
    console.log('[Wallet] Disconnecting...');
    
    if (selectedWallet === 'walletconnect') {
      await walletConnect.disconnect();
    }
    
    setAddress(null);
    setBalance(null);
    setChainId(null);
    setSelectedWallet(null);
    setIsTransactionReady(false);
    setError(null);
    setShowWalletConnectModal(false);
    
    if (selectedWallet === 'guest') {
      sessionStorage.removeItem('guestWalletAddress');
    }
    
    console.log('[Wallet] Disconnected');
  }, [selectedWallet, walletConnect]);

  const switchToBase = useCallback(async () => {
    if (!hasInjectedProvider()) {
      setError('No wallet detected');
      return;
    }

    try {
      const ethereum = (window as any).ethereum;
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
      });
      console.log('[Wallet] Switched to Base network');
      setError(null);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          const ethereum = (window as any).ethereum;
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              },
            ],
          });
          console.log('[Wallet] Added and switched to Base network');
          setError(null);
        } catch (addError: any) {
          console.error('[Wallet] Failed to add Base network:', addError);
          const errorMsg = addError.message || 'Failed to add Base network';
          setError(errorMsg);
        }
      } else if (switchError.code === 4001) {
        setError('Network switch rejected. Please approve the network switch in your wallet.');
      } else {
        console.error('[Wallet] Failed to switch network:', switchError);
        const errorMsg = switchError.message || 'Failed to switch to Base network';
        setError(errorMsg);
      }
    }
  }, []);

  const retry = useCallback(async () => {
    console.log('[Wallet] Retrying connection...');
    if (selectedWallet && selectedWallet !== 'guest') {
      await connect(selectedWallet);
    }
  }, [selectedWallet, connect]);

  const autoConnect = useCallback(async () => {
    if (isInitialized) return;

    console.log('[Wallet] Attempting auto-connect...');

    try {
      if (hasInjectedProvider()) {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({ method: 'eth_accounts' });

        if (accounts.length > 0) {
          const detectedWallet = detectWalletType();
          const walletToUse = detectedWallet || 'injected';
          console.log('[Wallet] Auto-connecting to:', walletToUse);
          setSelectedWallet(walletToUse);
          setAddress(accounts[0]);

          const currentChainId = await ethereum.request({ method: 'eth_chainId' });
          const chainIdNum = parseInt(currentChainId, 16);
          setChainId(chainIdNum);

          await fetchBalance(accounts[0]);
          
          const isReady = await verifyTransactionReadiness(accounts[0]);
          setIsTransactionReady(isReady);

          console.log('[Wallet] Auto-connected successfully');
        }
      }
    } catch (err) {
      console.error('[Wallet] Auto-connect failed:', err);
    } finally {
      setIsInitialized(true);
    }
  }, [isInitialized, fetchBalance, verifyTransactionReadiness]);

  // Build available wallets list
  const availableWallets: WalletType[] = ['walletconnect', 'guest'];
  if (hasInjectedProvider()) {
    const detectedWallet = detectWalletType();
    if (detectedWallet) {
      availableWallets.unshift(detectedWallet);
    } else {
      // Generic injected wallet available but not specifically identified
      availableWallets.unshift('injected');
    }
  }

  return {
    address,
    balance,
    chainId,
    isConnected: !!address,
    isConnecting,
    error,
    walletNotDetected,
    availableWallets,
    selectedWallet,
    isTransactionReady,
    connect,
    disconnect,
    switchToBase,
    autoConnect,
    checkWalletAvailability,
    showWalletConnectModal,
    setShowWalletConnectModal,
    dismissWalletNotDetected,
    walletConnectUri,
    clearError,
    isOnBaseNetwork,
    cancelWalletConnect,
    retry,
  };
}
