import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Copy, ExternalLink, Loader2, X, AlertCircle, QrCode } from 'lucide-react';
import { useWeb3WalletContext } from '../contexts/Web3WalletContext';
import { toast } from 'sonner';

interface WalletConnectModalProps {
  onClose: () => void;
}

export function WalletConnectModal({ onClose }: WalletConnectModalProps) {
  const wallet = useWeb3WalletContext();

  const uri = wallet.walletConnectUri;

  const handleCopyUri = () => {
    if (uri) {
      navigator.clipboard.writeText(uri);
      toast.success('Connection URI copied to clipboard');
    }
  };

  const handleOpenDeepLink = (walletName: string, deepLinkPrefix: string) => {
    if (uri) {
      const deepLink = `${deepLinkPrefix}wc?uri=${encodeURIComponent(uri)}`;
      window.open(deepLink, '_blank');
    }
  };

  const handleRetry = () => {
    wallet.clearError();
    wallet.connect('walletconnect');
  };

  // Auto-close on successful connection
  React.useEffect(() => {
    if (wallet.isConnected && wallet.selectedWallet === 'walletconnect') {
      onClose();
    }
  }, [wallet.isConnected, wallet.selectedWallet, onClose]);

  // Generate QR code URL using an external service
  const qrCodeUrl = uri 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uri)}`
    : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect with WalletConnect</DialogTitle>
          <DialogDescription>
            Scan the QR code or use a deep link to connect your mobile wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {wallet.error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{wallet.error}</p>
            </div>
          )}

          {!uri && !wallet.error && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Generating connection URI...</p>
            </div>
          )}

          {uri && !wallet.error && (
            <>
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img 
                      src={qrCodeUrl} 
                      alt="WalletConnect QR Code" 
                      className="rounded-lg border bg-white p-4"
                      onError={(e) => {
                        // Fallback if QR code service fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <QrCode className="h-8 w-8 text-primary opacity-0" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUri}
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Connection URI
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeepLink('MetaMask', 'metamask://')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    MetaMask
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeepLink('Trust Wallet', 'trust://')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Trust
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeepLink('Rainbow', 'rainbow://')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Rainbow
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeepLink('Coinbase', 'cbwallet://')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Coinbase
                  </Button>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Waiting for wallet approval...
              </p>
            </>
          )}

          {wallet.error && (
            <Button onClick={handleRetry} variant="outline" className="w-full">
              Retry Connection
            </Button>
          )}

          <Button variant="ghost" onClick={onClose} className="w-full">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
