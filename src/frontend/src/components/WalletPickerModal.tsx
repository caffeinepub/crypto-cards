import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';

interface WalletPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WalletPickerModal({ open, onOpenChange }: WalletPickerModalProps) {
  const wallet = useWeb3Wallet();

  const handleWalletSelect = async (walletType: 'coinbase' | 'metamask' | 'walletconnect' | 'guest') => {
    // Clear any previous errors
    wallet.clearError();
    
    await wallet.connect(walletType);
    
    // Close modal for non-WalletConnect wallets (WalletConnect has its own modal)
    if (walletType !== 'walletconnect') {
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    wallet.clearError();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Choose how you want to connect to the app
          </DialogDescription>
        </DialogHeader>

        {/* Display error if present */}
        {wallet.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {wallet.error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 justify-start"
            onClick={() => handleWalletSelect('coinbase')}
            disabled={wallet.isConnecting}
          >
            <img 
              src="/assets/generated/coinbase-wallet-logo-transparent.dim_64x64.png" 
              alt="Coinbase" 
              className="w-6 h-6"
            />
            Coinbase Wallet
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 justify-start"
            onClick={() => handleWalletSelect('metamask')}
            disabled={wallet.isConnecting}
          >
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
              alt="MetaMask" 
              className="w-6 h-6"
            />
            MetaMask
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 justify-start"
            onClick={() => handleWalletSelect('walletconnect')}
            disabled={wallet.isConnecting}
          >
            <img 
              src="/assets/generated/walletconnect-logo-transparent.dim_64x64.png" 
              alt="WalletConnect" 
              className="w-6 h-6"
            />
            WalletConnect
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => handleWalletSelect('guest')}
            disabled={wallet.isConnecting}
          >
            Continue as Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
