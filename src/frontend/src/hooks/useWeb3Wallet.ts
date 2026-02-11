import { useState, useEffect, useCallback } from 'react';
import { useWalletConnect } from './useWalletConnect';

export type WalletType = 'coinbase' | 'metamask' | 'walletconnect' | 'guest' | null;

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
  disconnect: () => void;
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
        const balanceWei = parseInt(balanceHex, 16);
        const balanceValue = (balanceWei / 1e18).toFixed(4);
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
      const provider = (window as any).ethereum;

      const handleAccountsChanged = async (accounts: string[]) => {
        console.log('[Wallet] Accounts changed:', accounts);
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          await fetchBalance(accounts[0]);
          
          const isReady = await verifyTransactionReadiness(accounts[0]);
          setIsTransactionReady(isReady);
          console.log('[Wallet] Transaction ready after account change:', isReady);
        } else {
          setAddress(null);
          setBalance(null);
          setSelectedWallet(null);
          setIsTransactionReady(false);
          localStorage.removeItem('lastConnectedWallet');
        }
      };

      const handleChainChanged = async (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        console.log('[Wallet] Chain changed:', newChainId);
        setChainId(newChainId);
        
        if (address) {
          await fetchBalance(address);
          const isReady = await verifyTransactionReadiness(address);
          setIsTransactionReady(isReady);
          console.log('[Wallet] Transaction ready after chain change:', isReady);
        }
      };

      const handleDisconnect = () => {
        console.log('[Wallet] Disconnected');
        setAddress(null);
        setBalance(null);
        setChainId(null);
        setSelectedWallet(null);
        setIsTransactionReady(false);
        localStorage.removeItem('lastConnectedWallet');
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      provider.on('disconnect', handleDisconnect);

      return () => {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
        provider.removeListener('disconnect', handleDisconnect);
      };
    }
  }, [address, selectedWallet, fetchBalance, verifyTransactionReadiness]);

  // Auto-verify transaction readiness when address and balance are both available
  useEffect(() => {
    if (address && balance && !isTransactionReady && selectedWallet !== 'guest' && selectedWallet !== 'walletconnect') {
      console.log('[Wallet] Address and balance detected, verifying transaction readiness...');
      const verifyReadiness = async () => {
        const isReady = await verifyTransactionReadiness(address);
        setIsTransactionReady(isReady);
        console.log('[Wallet] Auto-verification result:', isReady);
      };
      
      const timer = setTimeout(verifyReadiness, 800);
      return () => clearTimeout(timer);
    }
  }, [address, balance, selectedWallet, isTransactionReady, verifyTransactionReadiness]);

  const checkWalletAvailability = useCallback(() => {
    return hasInjectedProvider();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (selectedWallet === 'walletconnect') {
      walletConnect.clearError();
    }
  }, [selectedWallet, walletConnect]);

  const dismissWalletNotDetected = useCallback(() => {
    setWalletNotDetected(false);
  }, []);

  const autoConnect = useCallback(async () => {
    if (isInitialized) return;
    
    console.log('[Wallet] Auto-connect initiated');
    setIsInitialized(true);
    
    const lastWallet = localStorage.getItem('lastConnectedWallet');
    
    if (lastWallet === 'walletconnect' && walletConnect.isConnected && walletConnect.session) {
      const wcAddress = walletConnect.session.accounts[0];
      if (wcAddress) {
        console.log('[Wallet] Auto-connecting WalletConnect:', wcAddress);
        setAddress(wcAddress);
        setSelectedWallet('walletconnect');
        setChainId(walletConnect.session.chainId);
        setIsTransactionReady(true);
        
        const bal = await walletConnect.getBalance(wcAddress);
        setBalance(bal);
      }
    } else if ((lastWallet === 'coinbase' || lastWallet === 'metamask') && hasInjectedProvider()) {
      try {
        setIsConnecting(true);
        const provider = (window as any).ethereum;
        
        const accounts = await provider.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          console.log('[Wallet] Found connected account:', accounts[0]);
          const detectedType = detectWalletType();
          setAddress(accounts[0]);
          setSelectedWallet(detectedType || 'coinbase');
          
          const chainIdHex = await provider.request({ method: 'eth_chainId' });
          const currentChainId = parseInt(chainIdHex, 16);
          setChainId(currentChainId);
          
          const fetchedBalance = await fetchBalance(accounts[0]);
          
          setTimeout(async () => {
            const isReady = await verifyTransactionReadiness(accounts[0]);
            setIsTransactionReady(isReady);
            console.log('[Wallet] Auto-connected successfully, transaction ready:', isReady);
            
            if (!isReady && fetchedBalance) {
              console.log('[Wallet] Balance available but not ready, retrying...');
              setTimeout(async () => {
                const retryReady = await verifyTransactionReadiness(accounts[0]);
                setIsTransactionReady(retryReady);
                console.log('[Wallet] Final retry transaction ready:', retryReady);
              }, 1500);
            }
          }, 1000);
        } else {
          console.log('[Wallet] No connected accounts found');
          localStorage.removeItem('lastConnectedWallet');
        }
      } catch (err) {
        console.error('[Wallet] Auto-connect failed:', err);
        localStorage.removeItem('lastConnectedWallet');
      } finally {
        setIsConnecting(false);
      }
    } else if (lastWallet === 'guest') {
      const guestAddress = generateGuestWalletAddress();
      setAddress(guestAddress);
      setBalance('10.0000');
      setChainId(BASE_CHAIN_ID);
      setSelectedWallet('guest');
      setIsTransactionReady(true);
      console.log('[Wallet] Auto-connected guest wallet');
    }
  }, [isInitialized, fetchBalance, verifyTransactionReadiness, walletConnect]);

  const connect = useCallback(async (walletType: WalletType = 'coinbase') => {
    console.log('[Wallet] Connect initiated:', walletType);
    setIsConnecting(true);
    setError(null);
    setWalletNotDetected(false);

    try {
      if (walletType === 'guest') {
        const guestAddress = generateGuestWalletAddress();
        setAddress(guestAddress);
        setBalance('10.0000');
        setChainId(BASE_CHAIN_ID);
        setSelectedWallet('guest');
        setIsTransactionReady(true);
        localStorage.setItem('lastConnectedWallet', 'guest');
        console.log('[Wallet] Guest wallet connected:', guestAddress);
        setIsConnecting(false);
      } else if (walletType === 'walletconnect') {
        console.log('[Wallet] Initiating WalletConnect...');
        setSelectedWallet('walletconnect');
        setShowWalletConnectModal(true);
        setIsConnecting(false);
        
        // Start WalletConnect connection
        await walletConnect.connect();
        
        // Connection state is now managed by WalletConnect hook
        if (walletConnect.isConnected && walletConnect.session) {
          localStorage.setItem('lastConnectedWallet', 'walletconnect');
        }
      } else if (walletType === 'coinbase' || walletType === 'metamask') {
        // Check if on mobile or no injected provider
        const isMobile = isMobileDevice();
        const hasProvider = hasInjectedProvider();
        
        if (!hasProvider) {
          console.log('[Wallet] No injected provider detected');
          setWalletNotDetected(true);
          setIsConnecting(false);
          return;
        }

        if (walletType === 'coinbase' && (isMobile || !hasProvider)) {
          // Redirect to Coinbase Wallet deep link
          const currentUrl = window.location.href;
          const deepLink = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`;
          window.location.href = deepLink;
          return;
        }

        if (walletType === 'metamask' && isMobile && !hasProvider) {
          // Redirect to MetaMask deep link
          const currentUrl = window.location.href;
          const deepLink = `https://metamask.app.link/dapp/${encodeURIComponent(currentUrl)}`;
          window.location.href = deepLink;
          return;
        }

        // Desktop or injected provider available
        const provider = (window as any).ethereum;
        
        const accounts = await provider.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          const detectedType = detectWalletType();
          setAddress(accounts[0]);
          setSelectedWallet(detectedType || walletType);
          
          const chainIdHex = await provider.request({ method: 'eth_chainId' });
          const currentChainId = parseInt(chainIdHex, 16);
          setChainId(currentChainId);
          
          const fetchedBalance = await fetchBalance(accounts[0]);
          
          setTimeout(async () => {
            const isReady = await verifyTransactionReadiness(accounts[0]);
            setIsTransactionReady(isReady);
            console.log('[Wallet] Connected successfully, transaction ready:', isReady);
            
            if (!isReady && fetchedBalance) {
              console.log('[Wallet] Balance available but not ready, retrying...');
              setTimeout(async () => {
                const retryReady = await verifyTransactionReadiness(accounts[0]);
                setIsTransactionReady(retryReady);
                console.log('[Wallet] Final retry transaction ready:', retryReady);
              }, 1500);
            }
          }, 1000);
          
          localStorage.setItem('lastConnectedWallet', walletType);
        }
        setIsConnecting(false);
      }
    } catch (err: any) {
      console.error('[Wallet] Connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnecting(false);
    }
  }, [fetchBalance, verifyTransactionReadiness, walletConnect]);

  const disconnect = useCallback(() => {
    console.log('[Wallet] Disconnecting wallet:', selectedWallet);
    
    if (selectedWallet === 'walletconnect') {
      walletConnect.disconnect();
    }
    
    setAddress(null);
    setBalance(null);
    setChainId(null);
    setSelectedWallet(null);
    setIsTransactionReady(false);
    setError(null);
    setShowWalletConnectModal(false);
    localStorage.removeItem('lastConnectedWallet');
    
    console.log('[Wallet] Disconnected and state cleared');
  }, [selectedWallet, walletConnect]);

  const switchToBase = useCallback(async () => {
    if (!hasInjectedProvider()) {
      setError('No wallet provider detected');
      return;
    }

    try {
      const provider = (window as any).ethereum;
      
      // Try to switch to Base network
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2105' }], // Base Mainnet (8453 in hex)
      });
      
      console.log('[Wallet] Switched to Base network');
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to the wallet
      if (switchError.code === 4902) {
        try {
          const provider = (window as any).ethereum;
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x2105',
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
        } catch (addError: any) {
          console.error('[Wallet] Failed to add Base network:', addError);
          setError('Failed to add Base network to wallet');
        }
      } else {
        console.error('[Wallet] Failed to switch to Base network:', switchError);
        setError('Failed to switch to Base network');
      }
    }
  }, []);

  return {
    address,
    balance,
    chainId,
    isConnected: !!address,
    isConnecting,
    error,
    walletNotDetected,
    availableWallets: ['coinbase', 'metamask', 'walletconnect', 'guest'],
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
  };
}
