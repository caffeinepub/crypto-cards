# Specification

## Summary
**Goal:** Fix non-guest (real) wallet connection reliability for injected browser wallets and add clearer user-facing diagnostics and recovery paths when connection/transaction readiness fails.

**Planned changes:**
- Update wallet detection/picker behavior to offer a generic injected-wallet option (e.g., “Browser Wallet”) when `window.ethereum` exists but the wallet cannot be identified as MetaMask/Coinbase.
- Ensure the injected-wallet option runs the standard connect flow (`eth_requestAccounts`, `eth_chainId`, balance fetch) and reaches a connected state with the address shown in the Wallet section.
- Improve error handling so rejected/failed connection attempts show a clear English error, reset the connecting state, and allow retry without refreshing.
- Add user-visible diagnostics and guidance when connected but not transaction-ready, and when on the wrong network; surface switch-to-network errors and provide a way to dismiss/clear errors and retry.

**User-visible outcome:** Users with an injected browser wallet can connect even if it isn’t detected as MetaMask/Coinbase, see their address when connected, and receive clear English guidance/errors (with dismissal and retry) for network, authorization, or other connection issues.
