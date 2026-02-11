# Specification

## Summary
**Goal:** Make the Connect Wallet flow responsive and user-friendly by showing the WalletConnect modal, showing an install prompt when no injected wallet exists, and providing clear progress/error feedback during connection attempts.

**Planned changes:**
- Render a closable WalletConnect modal whenever `useWeb3Wallet().showWalletConnectModal` is true, and ensure closing it sets the flag back to false.
- Mount `WalletInstallModal` at the app level so `wallet.walletNotDetected` reliably shows an “Install a Wallet” modal, and clear the prompt state when dismissed.
- Add user-facing progress/error feedback for wallet connections: disable connect actions while `wallet.isConnecting`, and show English messages for rejection, failures, or pending requests.

**User-visible outcome:** Tapping “Connect Wallet” visibly opens the appropriate modal (WalletConnect or Install Wallet), users can close modals without getting stuck, and connection attempts show clear in-app progress/error messages instead of requiring the dev console.
