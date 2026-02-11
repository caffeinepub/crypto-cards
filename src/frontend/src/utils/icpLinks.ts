/**
 * Utility functions for ICP link generation and site origin handling
 */

/**
 * Get the current site origin from window.location
 */
export function getCurrentSiteOrigin(): string {
  return window.location.origin;
}

/**
 * Attempt to resolve the canister ID from available frontend build/runtime constants
 * Returns null if canister ID cannot be determined
 */
export function getCanisterId(): string | null {
  try {
    // Try to get canister ID from environment variables or build constants
    // The canister ID might be available in different ways depending on the build setup
    
    // Method 1: Check if it's in the URL (common for IC deployments)
    const hostname = window.location.hostname;
    
    // Pattern: <canister-id>.ic0.app or <canister-id>.raw.ic0.app
    const ic0Match = hostname.match(/^([a-z0-9-]+)\.(?:raw\.)?ic0\.app$/i);
    if (ic0Match) {
      return ic0Match[1];
    }
    
    // Pattern: <canister-id>.icp0.io
    const icp0Match = hostname.match(/^([a-z0-9-]+)\.icp0\.io$/i);
    if (icp0Match) {
      return icp0Match[1];
    }

    // Pattern: <canister-id>.localhost (local development)
    const localhostMatch = hostname.match(/^([a-z0-9-]+)\.localhost$/i);
    if (localhostMatch) {
      return localhostMatch[1];
    }
    
    // Method 2: Check for canister ID in local development
    // During local development, the canister ID might be in localStorage or sessionStorage
    const localCanisterId = localStorage.getItem('canisterId') || sessionStorage.getItem('canisterId');
    if (localCanisterId) {
      return localCanisterId;
    }
    
    // Method 3: Try to extract from any global config if available
    if (typeof window !== 'undefined' && (window as any).canisterId) {
      return (window as any).canisterId;
    }

    // Method 4: Check for canister ID in the URL path (some deployments use this pattern)
    const pathMatch = window.location.pathname.match(/\/canister\/([a-z0-9-]+)/i);
    if (pathMatch) {
      return pathMatch[1];
    }

    // Method 5: Try to read from import.meta.env if available (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const viteCanisterId = import.meta.env.VITE_CANISTER_ID || 
                             import.meta.env.VITE_BACKEND_CANISTER_ID ||
                             import.meta.env.CANISTER_ID_BACKEND;
      if (viteCanisterId) {
        return viteCanisterId;
      }
    }

    // Method 6: Try to read from process.env if available (fallback)
    if (typeof process !== 'undefined' && process.env) {
      const processCanisterId = (process.env as any).CANISTER_ID_BACKEND || 
                                (process.env as any).BACKEND_CANISTER_ID;
      if (processCanisterId) {
        return processCanisterId;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to resolve canister ID:', error);
    return null;
  }
}

/**
 * Generate the public IC gateway URL (ic0.app) for the current canister
 * Returns null if canister ID cannot be determined
 */
export function getPublicIcpLink(): string | null {
  const canisterId = getCanisterId();
  if (!canisterId) {
    return null;
  }
  return `https://${canisterId}.ic0.app`;
}

/**
 * Copy text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
