import { useState, useEffect, useCallback } from 'react';

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
    if (address && balance && !isTransactionReady && selectedWallet !== 'guest') {
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

  const autoConnect = useCallback(async () => {
    if (isInitialized) return;
    
    console.log('[Wallet] Auto-connect initiated');
    setIsInitialized(true);
    
    const lastWallet = localStorage.getItem('lastConnectedWallet');
    
    if ((lastWallet === 'coinbase' || lastWallet === 'metamask') && hasInjectedProvider()) {
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
  }, [isInitialized, fetchBalance, verifyTransactionReadiness]);

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
      } else if (walletType === 'walletconnect') {
        // Show WalletConnect modal with instructions
        console.log('[Wallet] Opening WalletConnect modal...');
        setShowWalletConnectModal(true);
        setIsConnecting(false);
        return;
      } else if (walletType === 'coinbase' || walletType === 'metamask') {
        if (!hasInjectedProvider()) {
          setWalletNotDetected(true);
          throw new Error('No Web3 wallet detected. Please install Coinbase Wallet or MetaMask.');
        }

        const provider = (window as any).ethereum;
        const accounts = await provider.request({ 
          method: 'eth_requestAccounts' 
        });

        if (accounts && accounts.length > 0) {
          console.log('[Wallet] Account connected:', accounts[0]);
          const detectedType = detectWalletType();
          setAddress(accounts[0]);
          setSelectedWallet(detectedType || walletType);
          localStorage.setItem('lastConnectedWallet', detectedType || walletType);
          
          const chainIdHex = await provider.request({ method: 'eth_chainId' });
          const currentChainId = parseInt(chainIdHex, 16);
          setChainId(currentChainId);
          console.log('[Wallet] Current chain ID:', currentChainId);

          if (currentChainId !== BASE_CHAIN_ID) {
            console.log('[Wallet] Not on Base network, switching...');
            await switchToBase();
          }

          const fetchedBalance = await fetchBalance(accounts[0]);
          
          setTimeout(async () => {
            const isReady = await verifyTransactionReadiness(accounts[0]);
            setIsTransactionReady(isReady);
            console.log('[Wallet] First verification - transaction ready:', isReady);
            
            if (!isReady && fetchedBalance) {
              console.log('[Wallet] Not ready yet, scheduling retry...');
              setTimeout(async () => {
                const retryReady = await verifyTransactionReadiness(accounts[0]);
                setIsTransactionReady(retryReady);
                console.log('[Wallet] Second verification - transaction ready:', retryReady);
                
                if (!retryReady && fetchedBalance) {
                  console.log('[Wallet] Still not ready, final retry...');
                  setTimeout(async () => {
                    const finalReady = await verifyTransactionReadiness(accounts[0]);
                    setIsTransactionReady(finalReady);
                    console.log('[Wallet] Final verification - transaction ready:', finalReady);
                  }, 3000);
                }
              }, 2000);
            }
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error('[Wallet] Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsTransactionReady(false);
      
      if (err.code === 4001) {
        setError('User rejected the connection request');
      } else if (err.code === -32002) {
        setError('Connection request already pending. Please check your wallet.');
      }
    } finally {
      if (walletType !== 'walletconnect') {
        setIsConnecting(false);
      }
    }
  }, [fetchBalance, verifyTransactionReadiness]);

  const disconnect = useCallback(async () => {
    console.log('[Wallet] Disconnect');
    
    if (selectedWallet === 'guest') {
      sessionStorage.removeItem('guestWalletAddress');
    }
    
    setAddress(null);
    setBalance(null);
    setChainId(null);
    setSelectedWallet(null);
    setIsTransactionReady(false);
    localStorage.removeItem('lastConnectedWallet');
  }, [selectedWallet]);

  const switchToBase = useCallback(async () => {
    console.log('[Wallet] Switching to Base network');
    
    if (hasInjectedProvider()) {
      const provider = (window as any).ethereum;

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }],
        });
        setChainId(BASE_CHAIN_ID);
        console.log('[Wallet] Switched to Base network');
        
        if (address) {
          setTimeout(async () => {
            const isReady = await verifyTransactionReadiness(address);
            setIsTransactionReady(isReady);
            console.log('[Wallet] Transaction ready after network switch:', isReady);
          }, 1000);
        }
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
                chainName: 'Base',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              }],
            });
            setChainId(BASE_CHAIN_ID);
            console.log('[Wallet] Added and switched to Base network');
            
            if (address) {
              setTimeout(async () => {
                const isReady = await verifyTransactionReadiness(address);
                setIsTransactionReady(isReady);
                console.log('[Wallet] Transaction ready after adding network:', isReady);
              }, 1000);
            }
          } catch (addError) {
            console.error('[Wallet] Failed to add Base network:', addError);
            throw addError;
          }
        } else {
          throw switchError;
        }
      }
    }
  }, [address, verifyTransactionReadiness]);

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
  };
}
