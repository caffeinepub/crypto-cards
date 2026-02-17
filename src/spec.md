# Specification

## Summary
**Goal:** Make wallet connections and real-money balance display reliable and accurate in the live build.

**Planned changes:**
- Update WalletSection in real-money mode to show the connected wallet’s actual on-chain balance (via injected provider or WalletConnect) and a clear “not connected” state when no wallet is connected.
- Fix ETH balance parsing/formatting to be BigInt-safe and consistent across providers, preventing overflow/precision issues.
- Harden connect/disconnect, auto-restore on refresh, and account/chain change handling so address, chainId (Base 8453), balance, and transaction readiness stay in sync.
- Gate deposit/withdraw UI so actions are only enabled when in real-money mode and the wallet is connected, transaction-ready, and on Base; show clear English error messages and support switch-to-Base when available.

**User-visible outcome:** Players can connect/disconnect wallets reliably, see correct on-chain balances in real-money mode, and only attempt deposit/withdraw when their wallet is ready on the Base network—with clear guidance when it isn’t.
