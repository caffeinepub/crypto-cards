import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Wallet, AlertCircle } from 'lucide-react';
import { useWeb3WalletContext } from '../contexts/Web3WalletContext';

interface WalletPickerModalProps {
  onClose: () => void;
}

export function WalletPickerModal({ onClose }: WalletPickerModalProps) {
  const wallet = useWeb3WalletContext();

  const handleConnect = async (walletType: 'coinbase' | 'metamask' | 'walletconnect' | 'guest') => {
    wallet.clearError();
    await wallet.connect(walletType);
    if (walletType !== 'walletconnect') {
      onClose();
    }
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
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{wallet.error}</p>
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
              <Wallet className="mr-3 h-6 w-6" />
              MetaMask
            </Button>
          )}

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

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleConnect('guest')}
            disabled={wallet.isConnecting}
          >
            <Wallet className="mr-3 h-6 w-6" />
            Guest Wallet (Demo)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
