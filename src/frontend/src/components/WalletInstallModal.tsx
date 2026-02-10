import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Wallet } from 'lucide-react';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import { SiCoinbase } from 'react-icons/si';

export default function WalletInstallModal() {
  const wallet = useWeb3Wallet();

  const handleClose = () => {
    wallet.disconnect();
  };

  return (
    <Dialog open={wallet.walletNotDetected} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Install a Wallet
          </DialogTitle>
          <DialogDescription>
            You need a Web3 wallet to connect
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-primary/50 bg-primary/5">
          <AlertDescription>
            <strong>Recommended:</strong> Install a browser extension wallet for the best experience.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Browser Extension Wallets</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Install one of these browser extensions:
            </p>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open('https://www.coinbase.com/wallet', '_blank')}
            >
              <div className="flex items-center gap-2">
                <SiCoinbase className="w-6 h-6 text-blue-600" />
                <span>Coinbase Wallet</span>
              </div>
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => window.open('https://metamask.io/', '_blank')}
            >
              <div className="flex items-center gap-2">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                  alt="MetaMask" 
                  className="w-6 h-6"
                />
                <span>MetaMask</span>
              </div>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              After installing a browser wallet, refresh this page to connect.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
