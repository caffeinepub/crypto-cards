import { useState, useEffect, useCallback, useRef } from 'react';
import { getWalletConnectClient, resetWalletConnectClient, WalletConnectSession } from '../lib/walletconnect';

interface UseWalletConnectReturn {
  isInitializing: boolean;
  isConnecting: boolean;
  isAwaitingUser: boolean;
  isConnected: boolean;
  session: WalletConnectSession | null;
  uri: string | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  cancelConnection: () => void;
  getBalance: (address: string) => Promise<string>;
  clearError: () => void;
  reset: () => void;
}

export function useWalletConnect(): UseWalletConnectReturn {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAwaitingUser, setIsAwaitingUser] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<WalletConnectSession | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const approvalPromiseRef = useRef<Promise<any> | null>(null);
  const isCancelledRef = useRef(false);

  // Initialize WalletConnect client
  useEffect(() => {
    const init = async () => {
      try {
        console.log('[useWalletConnect] Starting initialization...');
        const client = getWalletConnectClient();
        await client.initialize();
        
        // Check for existing session
        const existingSession = client.getSession();
        if (existingSession && existingSession.accounts.length > 0) {
          setSession(existingSession);
          setIsConnected(true);
          console.log('[useWalletConnect] Restored session:', existingSession);
        }
        
        console.log('[useWalletConnect] Initialization complete');
      } catch (err: any) {
        console.error('[useWalletConnect] Initialization failed:', err);
        setError(err.message || 'Failed to initialize WalletConnect. Please try again.');
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    console.log('[useWalletConnect] Resetting all state');
    setIsConnecting(false);
    setIsAwaitingUser(false);
    setUri(null);
    setError(null);
    approvalPromiseRef.current = null;
    isCancelledRef.current = false;
  }, []);

  const cancelConnection = useCallback(() => {
    console.log('[useWalletConnect] Connection cancelled by user');
    isCancelledRef.current = true;
    reset();
  }, [reset]);

  const connect = useCallback(async () => {
    // Reset cancellation flag
    isCancelledRef.current = false;
    
    setIsConnecting(true);
    setIsAwaitingUser(false);
    setError(null);
    setUri(null);

    try {
      console.log('[useWalletConnect] Starting connect flow...');
      const client = getWalletConnectClient();
      
      // This will trigger initialization if not already done
      const { uri: connectionUri, approval } = await client.connect(8453);

      // Check if cancelled during initialization/connect
      if (isCancelledRef.current) {
        console.log('[useWalletConnect] Connect cancelled during setup');
        return;
      }

      setUri(connectionUri);
      setIsConnecting(false);
      setIsAwaitingUser(true);
      approvalPromiseRef.current = approval();
      console.log('[useWalletConnect] URI generated, awaiting user approval...');

      // Wait for user to approve in their wallet
      const approvedSession = await approvalPromiseRef.current;

      // Check if cancelled during approval wait
      if (isCancelledRef.current) {
        console.log('[useWalletConnect] Connect cancelled during approval');
        return;
      }

      const sessionData = client.getSession();

      if (sessionData && sessionData.accounts.length > 0) {
        setSession(sessionData);
        setIsConnected(true);
        setIsAwaitingUser(false);
        setUri(null);
        setError(null);
        approvalPromiseRef.current = null;
        console.log('[useWalletConnect] Connected successfully:', sessionData);
      } else {
        throw new Error('No accounts found in session. Please try again.');
      }
    } catch (err: any) {
      // Don't set error if user cancelled
      if (isCancelledRef.current) {
        console.log('[useWalletConnect] Ignoring error after cancellation');
        return;
      }

      console.error('[useWalletConnect] Connection failed:', err);
      const errorMessage = err.message || 'Failed to connect via WalletConnect. Please try again.';
      setError(errorMessage);
      setUri(null);
      setIsConnecting(false);
      setIsAwaitingUser(false);
      approvalPromiseRef.current = null;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const client = getWalletConnectClient();
      await client.disconnect();
      setSession(null);
      setIsConnected(false);
      reset();
      resetWalletConnectClient();
      console.log('[useWalletConnect] Disconnected');
    } catch (err: any) {
      console.error('[useWalletConnect] Disconnect failed:', err);
      // Still reset state even if disconnect fails
      setSession(null);
      setIsConnected(false);
      reset();
      resetWalletConnectClient();
    }
  }, [reset]);

  const getBalance = useCallback(async (address: string): Promise<string> => {
    try {
      const client = getWalletConnectClient();
      return await client.getBalance(address);
    } catch (err) {
      console.error('[useWalletConnect] Failed to fetch balance:', err);
      return '0.0000';
    }
  }, []);

  return {
    isInitializing,
    isConnecting,
    isAwaitingUser,
    isConnected,
    session,
    uri,
    error,
    connect,
    disconnect,
    cancelConnection,
    getBalance,
    clearError,
    reset,
  };
}
