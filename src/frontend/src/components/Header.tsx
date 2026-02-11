import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Spade, LogOut, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useWeb3WalletContext } from '../contexts/Web3WalletContext';
import { useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import DepositWithdrawModal from './DepositWithdrawModal';
import BackendConnectivityIndicator from './BackendConnectivityIndicator';
import { toast } from 'sonner';
import type { GameMode } from '../App';

interface HeaderProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export default function Header({ mode, onModeChange }: HeaderProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const wallet = useWeb3WalletContext();
  const queryClient = useQueryClient();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    if (isAuthenticated && mode === 'forReal') {
      wallet.autoConnect();
    }
  }, [isAuthenticated, mode]);

  // Show error toasts when wallet errors occur
  useEffect(() => {
    if (wallet.error) {
      toast.error(wallet.error);
    }
  }, [wallet.error]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      wallet.disconnect();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleModeToggle = (newMode: GameMode) => {
    onModeChange(newMode);
    if (newMode === 'forFun') {
      wallet.disconnect();
    } else if (isAuthenticated) {
      wallet.autoConnect();
    }
  };

  const handleWalletConnect = async (walletType: 'coinbase' | 'metamask' | 'walletconnect' | 'guest') => {
    try {
      await wallet.connect(walletType);
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  const handleWalletDisconnect = () => {
    wallet.disconnect();
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getWalletLabel = () => {
    if (wallet.selectedWallet === 'coinbase') return 'Coinbase Wallet';
    if (wallet.selectedWallet === 'metamask') return 'MetaMask';
    if (wallet.selectedWallet === 'walletconnect') return 'WalletConnect';
    if (wallet.selectedWallet === 'guest') return 'Guest Wallet';
    return 'Unknown Wallet';
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Spade className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Card Games
              </h1>
            </div>
            <BackendConnectivityIndicator />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-full p-1">
              <Button
                variant={mode === 'forFun' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeToggle('forFun')}
                className="rounded-full"
              >
                For Fun
              </Button>
              <Button
                variant={mode === 'forReal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleModeToggle('forReal')}
                className="rounded-full"
              >
                For Real
              </Button>
            </div>

            {mode === 'forReal' && isAuthenticated && (
              <>
                {wallet.isConnected ? (
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="gap-2 px-3 py-1.5 cursor-pointer">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="font-mono text-sm">
                              {shortenAddress(wallet.address || '')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {getWalletLabel()}
                            </span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono">{wallet.address}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Balance: {wallet.balance} ETH
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDepositModal(true)}
                      className="gap-2"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      Deposit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWithdrawModal(true)}
                      className="gap-2"
                    >
                      <ArrowUpFromLine className="w-4 h-4" />
                      Withdraw
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleWalletDisconnect}
                      disabled={wallet.isConnecting}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        disabled={wallet.isConnecting}
                      >
                        {wallet.isConnecting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect Wallet'
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Choose Wallet</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleWalletConnect('coinbase')}
                        disabled={wallet.isConnecting}
                        className="cursor-pointer"
                      >
                        <img
                          src="/assets/generated/coinbase-wallet-logo-transparent.dim_64x64.png"
                          alt="Coinbase"
                          className="w-5 h-5 mr-2"
                        />
                        Coinbase Wallet
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleWalletConnect('metamask')}
                        disabled={wallet.isConnecting}
                        className="cursor-pointer"
                      >
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                          alt="MetaMask"
                          className="w-5 h-5 mr-2"
                        />
                        MetaMask
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleWalletConnect('walletconnect')}
                        disabled={wallet.isConnecting}
                        className="cursor-pointer"
                      >
                        <img
                          src="/assets/generated/walletconnect-logo-transparent.dim_64x64.png"
                          alt="WalletConnect"
                          className="w-5 h-5 mr-2"
                        />
                        WalletConnect
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleWalletConnect('guest')}
                        disabled={wallet.isConnecting}
                        className="cursor-pointer"
                      >
                        Guest Wallet (Demo)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}

            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              variant={isAuthenticated ? 'outline' : 'default'}
              size="sm"
              className="gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : isAuthenticated ? (
                <>
                  <LogOut className="w-4 h-4" />
                  Logout
                </>
              ) : (
                'Login'
              )}
            </Button>
          </div>
        </div>
      </div>

      <DepositWithdrawModal
        open={showDepositModal}
        onOpenChange={setShowDepositModal}
        mode="deposit"
        walletBalance={wallet.balance}
      />

      <DepositWithdrawModal
        open={showWithdrawModal}
        onOpenChange={setShowWithdrawModal}
        mode="withdraw"
        walletBalance={wallet.balance}
      />
    </header>
  );
}
