import { useActor } from './useActor';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface UseActorWithRetryReturn {
  actor: any;
  isFetching: boolean;
  isConnected: boolean;
  isError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

export function useActorWithRetry(): UseActorWithRetryReturn {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Get the actor query from the cache to check its error state
    const actorQueryState = queryClient.getQueryState(['actor', actor ? 'authenticated' : 'anonymous']);
    
    if (actor && !isFetching) {
      // Actor is available and not fetching - connection successful
      setIsConnected(true);
      setIsError(false);
      setError(null);
      setRetryCount(0);
      setIsRetrying(false);
    } else if (!actor && isFetching) {
      // Actor is being fetched - show retrying state
      setIsRetrying(true);
      setIsConnected(false);
      
      // Increment retry count if we're in an error state
      if (actorQueryState?.error) {
        setRetryCount(prev => prev + 1);
      }
    } else if (!actor && !isFetching) {
      // Actor failed to load and is not retrying
      setIsConnected(false);
      setIsRetrying(false);
      
      // Check if there's an error in the query state
      if (actorQueryState?.error) {
        setIsError(true);
        const queryError = actorQueryState.error as Error;
        
        // Create a user-friendly error message
        let friendlyMessage = 'Unable to connect to the backend service.';
        
        if (queryError.message.includes('fetch')) {
          friendlyMessage = 'Network error: Cannot reach the backend. Please check your internet connection.';
        } else if (queryError.message.includes('timeout')) {
          friendlyMessage = 'Connection timeout: The backend is taking too long to respond.';
        } else if (queryError.message.includes('refused')) {
          friendlyMessage = 'Connection refused: The backend service may be offline.';
        } else if (queryError.message) {
          friendlyMessage = `Connection error: ${queryError.message}`;
        }
        
        setError(new Error(friendlyMessage));
      } else {
        // No specific error, but actor is not available
        setIsError(true);
        setError(new Error('Backend connection is not available. Please try refreshing the page.'));
      }
    }
  }, [actor, isFetching, queryClient]);

  return {
    actor,
    isFetching,
    isConnected,
    isError,
    error,
    retryCount,
    isRetrying,
  };
}
