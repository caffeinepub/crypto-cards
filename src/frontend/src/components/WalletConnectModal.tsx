import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Smartphone, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Detect if user is on mobile device
function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const [copiedUri, setCopiedUri] = useState(false);
  
  const isMobile = isMobileDevice();
  
  // Example WalletConnect URI (in production, this would be generated dynamically)
  const exampleUri = 'wc:00e46b69-d0cc-4b3e-b6a2-cee442f97188@2?relay-protocol=irn&symKey=...';
  
  const handleCopyUri = () => {
    navigator.clipboard.writeText(exampleUri);
    setCopiedUri(true);
    toast.success('URI copied to clipboard');
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const handleOpenCoinbaseWallet = () => {
    const deepLink = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`;
    window.location.href = deepLink;
  };

  const handleOpenMetaMask = () => {
    const deepLink = `https://metamask.app.link/dapp/${window.location.host}`;
    window.location.href = deepLink;
  };

  const handleOpenTrustWallet = () => {
    const deepLink = `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}`;
    window.location.href = deepLink;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="/assets/generated/walletconnect-logo-transparent.dim_64x64.png" 
              alt="WalletConnect" 
              className="w-6 h-6"
            />
            Connect with WalletConnect
          </DialogTitle>
          <DialogDescription>
            {isMobile 
              ? 'Open your mobile wallet app to connect'
              : 'Scan QR code with your mobile wallet app'
            }
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-primary/50 bg-primary/5">
          <AlertDescription>
            <strong>Note:</strong> WalletConnect allows you to connect any mobile wallet app to this dApp.
          </AlertDescription>
        </Alert>

        {isMobile ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Open in Mobile Wallet
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Choose your wallet app to connect:
              </p>
              
              <Button
                variant="outline"
                className="w-full justify-between bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 border-2 border-primary/30"
                onClick={handleOpenCoinbaseWallet}
              >
                <div className="flex items-center gap-2">
                  <img 
                    src="/assets/generated/coinbase-wallet-logo-transparent.dim_64x64.png" 
                    alt="Coinbase Wallet" 
                    className="w-6 h-6"
                  />
                  <span>Coinbase Wallet</span>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={handleOpenMetaMask}
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

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={handleOpenTrustWallet}
              >
                <div className="flex items-center gap-2">
                  <img 
                    src="/assets/generated/wallet-icon-transparent.dim_64x64.png" 
                    alt="Trust Wallet" 
                    className="w-6 h-6"
                  />
                  <span>Trust Wallet</span>
                </div>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                If your wallet app is not listed, open it manually and look for "WalletConnect" or "Scan QR" option.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Scan QR Code
              </h3>
              
              <div className="p-6 border-2 border-primary/30 rounded-lg bg-white flex items-center justify-center">
                <div className="text-center space-y-3">
                  <img 
                    src="/assets/generated/qr-code-icon-transparent.dim_32x32.png" 
                    alt="QR Code" 
                    className="w-32 h-32 mx-auto opacity-50"
                  />
                  <p className="text-sm text-muted-foreground">
                    QR Code will appear here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (Requires WalletConnect SDK integration)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">How to connect:</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground ml-2">
                <li>Open your mobile wallet app (Coinbase Wallet, MetaMask, Trust Wallet, etc.)</li>
                <li>Look for "WalletConnect" or "Scan QR" option in the app</li>
                <li>Scan the QR code above with your phone's camera</li>
                <li>Approve the connection request in your wallet</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Don't have a mobile wallet? Install Coinbase Wallet or MetaMask on your phone first.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
