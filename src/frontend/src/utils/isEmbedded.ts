/**
 * Detects if the app is running in an embedded/iframe context
 * where WalletConnect may be blocked by browser security policies
 */
export function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if we're in an iframe
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions,
    // we're definitely in an iframe
    return true;
  }
}

/**
 * Opens the current app URL in a new top-level browser tab/window
 */
export function openInNewTab(): void {
  if (typeof window === 'undefined') return;
  
  const url = window.location.href;
  window.open(url, '_blank', 'noopener,noreferrer');
}
