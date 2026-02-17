import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Wallet, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useWeb3WalletContext } from '../contexts/Web3WalletContext';
import { WalletPickerModal } from './WalletPickerModal';
import { DepositWithdrawModal } from './DepositWithdrawModal';
import { isEmbedded, openInNewTab } from '../utils/isEmbedded';

export function WalletSection() {
  const wallet = useWeb3WalletContext();
  const [showPicker, setShowPicker] = useState(false);
  const [showDepositWithdraw, setShowDepositWithdraw] = useState(false);
  const [depositWithdrawType, setDepositWithdrawType] = useState<'deposit' | 'withdraw'>('deposit');
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    wallet.clearError();
    await wallet.retry();
    setIsRetrying(false);
  };

  const handleDismissError = () => {
    wallet.clearError();
  };

  const handleOpenDepositWithdraw = (type: 'deposit' | 'withdraw') => {
    setDepositWithdrawType(type);
    setShowDepositWithdraw(true);
  };

  const embedded = isEmbedded();

  // Not connected state
  if (!wallet.isConnected) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet
            </CardTitle>
            <CardDescription>Connect your wallet to play for real</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wallet.error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{wallet.error}</p>
                </div>
                <button
                  onClick={handleDismissError}
                  className="flex-shrink-0 hover:opacity-70 transition-opacity"
                  aria-label="Dismiss error"
                >
                  <span className="text-lg leading-none">&times;</span>
                </button>
              </div>
            )}

            {embedded && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Embedded Browser Detected</p>
                  <p className="text-xs">For the best wallet experience, open this app in your main browser.</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button
                onClick={() => setShowPicker(true)}
                disabled={wallet.isConnecting}
                className="w-full"
              >
                {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>

              {embedded && (
                <Button
                  onClick={openInNewTab}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              )}

              {wallet.error && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  disabled={isRetrying || wallet.isConnecting}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Retry Connection'}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              No wallet? Try Guest Mode to explore the app
            </p>
          </CardContent>
        </Card>

        {showPicker && <WalletPickerModal onClose={() => setShowPicker(false)} />}
      </>
    );
  }

  // Connected but not transaction ready
  if (!wallet.isTransactionReady && wallet.selectedWallet !== 'guest') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Authorization
          </CardTitle>
          <CardDescription>Complete wallet setup to enable transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-1">Authorization Incomplete</p>
              <p className="text-xs">Your wallet is connected but not fully authorized. Please approve all permissions in your wallet to enable deposits and withdrawals.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking...' : 'Complete Authorization'}
            </Button>

            <Button
              onClick={() => wallet.disconnect()}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected but wrong network
  if (!wallet.isOnBaseNetwork && wallet.selectedWallet !== 'guest') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wrong Network
          </CardTitle>
          <CardDescription>Switch to Base network to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-1">Base Network Required</p>
              <p className="text-xs">This app requires the Base network. Please switch networks in your wallet.</p>
            </div>
          </div>

          {wallet.error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{wallet.error}</p>
              </div>
              <button
                onClick={handleDismissError}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Dismiss error"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => wallet.switchToBase()}
              className="w-full"
            >
              Switch to Base Network
            </Button>

            <Button
              onClick={() => wallet.disconnect()}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connected and ready (or guest mode)
  const isGuest = wallet.selectedWallet === 'guest';
  const canTransact = wallet.isTransactionReady && wallet.isOnBaseNetwork && !isGuest;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
          <CardDescription>
            {isGuest ? 'Guest Mode (Demo Only)' : 'Connected to Base Network'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Address</span>
              <span className="font-mono text-xs">
                {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-semibold">{wallet.balance || '0.0000'} ETH</span>
            </div>
            {!isGuest && wallet.chainId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span>Base (Chain ID: {wallet.chainId})</span>
              </div>
            )}
          </div>

          {isGuest && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <p className="text-xs">
                You're in Guest Mode. Connect a real wallet to deposit funds and play for real.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {canTransact && (
              <>
                <Button
                  onClick={() => handleOpenDepositWithdraw('deposit')}
                  className="w-full"
                >
                  Deposit
                </Button>
                <Button
                  onClick={() => handleOpenDepositWithdraw('withdraw')}
                  variant="outline"
                  className="w-full"
                >
                  Withdraw
                </Button>
              </>
            )}

            <Button
              onClick={() => wallet.disconnect()}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {showDepositWithdraw && (
        <DepositWithdrawModal
          type={depositWithdrawType}
          onClose={() => setShowDepositWithdraw(false)}
        />
      )}
    </>
  );
}
