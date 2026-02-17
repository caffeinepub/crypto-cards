import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Wallet, AlertCircle, X } from 'lucide-react';
import { useWeb3WalletContext } from '../contexts/Web3WalletContext';

interface WalletPickerModalProps {
  onClose: () => void;
}

export function WalletPickerModal({ onClose }: WalletPickerModalProps) {
  const wallet = useWeb3WalletContext();

  const handleConnect = async (walletType: 'coinbase' | 'metamask' | 'injected' | 'walletconnect' | 'guest') => {
    wallet.clearError();
    await wallet.connect(walletType);
    if (walletType !== 'walletconnect') {
      onClose();
    }
  };

  const handleDismissError = () => {
    wallet.clearError();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect and start playing for real
          </DialogDescription>
        </DialogHeader>

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
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="space-y-2">
          {wallet.availableWallets.includes('coinbase') && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleConnect('coinbase')}
              disabled={wallet.isConnecting}
            >
              <img
                src="/assets/generated/coinbase-wallet-logo-transparent.dim_64x64.png"
                alt="Coinbase Wallet"
                className="mr-3 h-6 w-6"
              />
              Coinbase Wallet
            </Button>
          )}

          {wallet.availableWallets.includes('metamask') && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleConnect('metamask')}
              disabled={wallet.isConnecting}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                alt="MetaMask"
                className="mr-3 h-6 w-6"
              />
              MetaMask
            </Button>
          )}

          {wallet.availableWallets.includes('injected') && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleConnect('injected')}
              disabled={wallet.isConnecting}
            >
              <Wallet className="mr-3 h-5 w-5" />
              Browser Wallet
            </Button>
          )}

          {wallet.availableWallets.includes('walletconnect') && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleConnect('walletconnect')}
              disabled={wallet.isConnecting}
            >
              <img
                src="/assets/generated/walletconnect-logo-transparent.dim_64x64.png"
                alt="WalletConnect"
                className="mr-3 h-6 w-6"
              />
              WalletConnect
            </Button>
          )}

          {wallet.availableWallets.includes('guest') && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleConnect('guest')}
              disabled={wallet.isConnecting}
            >
              <Wallet className="mr-3 h-5 w-5" />
              Guest Mode (Demo)
            </Button>
          )}
        </div>

        {wallet.isConnecting && (
          <div className="text-center text-sm text-muted-foreground">
            Connecting...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
