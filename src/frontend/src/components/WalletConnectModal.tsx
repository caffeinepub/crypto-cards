import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle2, Smartphone, Monitor, Loader2, ExternalLink, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const [copied, setCopied] = useState(false);
  const wallet = useWeb3Wallet();
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const uri = wallet.walletConnectUri;
  const isGenerating = !uri && wallet.isConnecting;

  // Auto-close on successful connection
  useEffect(() => {
    if (wallet.isConnected && wallet.selectedWallet === 'walletconnect') {
      onOpenChange(false);
    }
  }, [wallet.isConnected, wallet.selectedWallet, onOpenChange]);

  const handleClose = () => {
    // Clear any errors when closing
    wallet.clearError();
    onOpenChange(false);
  };

  const handleCopyUri = async () => {
    if (!uri) {
      toast.error('Connection URI not available yet');
      return;
    }

    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      toast.success('Connection URI copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[WalletConnect] Failed to copy URI:', err);
      toast.error('Failed to copy URI');
    }
  };

  const handleMobileConnect = (walletApp: 'coinbase' | 'metamask' | 'trust') => {
    if (!uri) {
      toast.error('Connection URI not available yet');
      return;
    }

    const encodedUri = encodeURIComponent(uri);
    let deepLink = '';

    switch (walletApp) {
      case 'coinbase':
        deepLink = `https://go.cb-w.com/wc?uri=${encodedUri}`;
        break;
      case 'metamask':
        deepLink = `https://metamask.app.link/wc?uri=${encodedUri}`;
        break;
      case 'trust':
        deepLink = `https://link.trustwallet.com/wc?uri=${encodedUri}`;
        break;
    }

    window.location.href = deepLink;
  };

  const openQRGenerator = () => {
    if (!uri) {
      toast.error('Connection URI not available yet');
      return;
    }
    // Open a QR code generator service in a new tab
    const qrServiceUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uri)}`;
    window.open(qrServiceUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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
              ? 'Choose your wallet to connect' 
              : 'Use your mobile wallet to connect'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Generating state */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating connection...</p>
            </div>
          )}

          {/* Error state */}
          {wallet.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {wallet.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Desktop view with URI */}
          {uri && !isMobile && (
            <>
              <Alert>
                <Monitor className="h-4 w-4" />
                <AlertDescription>
                  Copy the connection URI below and paste it into your mobile wallet app, or generate a QR code to scan
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg border">
                  <p className="text-xs font-mono break-all text-muted-foreground">
                    {uri.slice(0, 60)}...
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleCopyUri}
                    disabled={!uri}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy URI
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={openQRGenerator}
                    disabled={!uri}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Generate QR
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Mobile view with deep links */}
          {uri && isMobile && (
            <>
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Select your wallet to open and connect
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleMobileConnect('coinbase')}
                  disabled={!uri}
                >
                  <img 
                    src="/assets/generated/coinbase-wallet-logo-transparent.dim_64x64.png" 
                    alt="Coinbase" 
                    className="w-5 h-5"
                  />
                  Connect with Coinbase Wallet
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleMobileConnect('metamask')}
                  disabled={!uri}
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                    alt="MetaMask" 
                    className="w-5 h-5"
                  />
                  Connect with MetaMask
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleMobileConnect('trust')}
                  disabled={!uri}
                >
                  <img 
                    src="https://trustwallet.com/assets/images/media/assets/TWT.png" 
                    alt="Trust Wallet" 
                    className="w-5 h-5"
                  />
                  Connect with Trust Wallet
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={handleCopyUri}
                disabled={!uri}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy URI Manually
                  </>
                )}
              </Button>
            </>
          )}

          {/* Awaiting approval state */}
          {uri && wallet.isConnecting && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Waiting for wallet approval...
              </AlertDescription>
            </Alert>
          )}

          {/* Retry button on error */}
          {wallet.error && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                wallet.clearError();
                wallet.connect('walletconnect');
              }}
            >
              Retry Connection
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
