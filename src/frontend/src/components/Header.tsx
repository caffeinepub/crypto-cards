import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Spade, LogOut, ArrowDownToLine, ArrowUpFromLine, CheckCircle2 } from 'lucide-react';
import { SiCoinbase } from 'react-icons/si';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import { GameMode } from '../App';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import DepositWithdrawModal from './DepositWithdrawModal';
import BackendConnectivityIndicator from './BackendConnectivityIndicator';

interface HeaderProps {
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  onDepositClick?: () => void;
  onWithdrawClick?: () => void;
}

export default function Header({ gameMode, onGameModeChange, onDepositClick, onWithdrawClick }: HeaderProps) {
  const wallet = useWeb3Wallet();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const handleModeToggle = (checked: boolean) => {
    onGameModeChange(checked ? 'real' : 'fun');
  };

  const handleWalletConnect = async (provider: 'walletconnect' | 'coinbase' | 'metamask') => {
    try {
      await wallet.connect(provider);
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await wallet.disconnect();
    } catch (error) {
      console.error('Wallet disconnect error:', error);
    }
  };

  const handleDepositClick = () => {
    if (onDepositClick) {
      onDepositClick();
    } else {
      setDepositModalOpen(true);
    }
  };

  const handleWithdrawClick = () => {
    if (onWithdrawClick) {
      onWithdrawClick();
    } else {
      setWithdrawModalOpen(true);
    }
  };

  const getWalletIcon = () => {
    if (wallet.selectedWallet === 'coinbase') {
      return <SiCoinbase className="h-4 w-4" />;
    }
    return <img src="/assets/generated/walletconnect-logo-transparent.dim_64x64.png" alt="Wallet" className="h-4 w-4" />;
  };

  const getWalletLabel = () => {
    if (wallet.selectedWallet === 'coinbase') return 'Coinbase Wallet';
    if (wallet.selectedWallet === 'metamask') return 'MetaMask';
    if (wallet.selectedWallet === 'walletconnect') return 'WalletConnect';
    return 'Connect Wallet';
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Spade className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Crypto Cards
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Spades & Omaha on Base
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Connectivity Indicator */}
            <BackendConnectivityIndicator />

            {/* Mode Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-primary/30 bg-card">
              <span className={`text-xs font-semibold transition-colors ${gameMode === 'fun' ? 'text-accent' : 'text-muted-foreground'}`}>
                Play for Fun
              </span>
              <Switch
                checked={gameMode === 'real'}
                onCheckedChange={handleModeToggle}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-xs font-semibold transition-colors ${gameMode === 'real' ? 'text-primary' : 'text-muted-foreground'}`}>
                Play for Real
              </span>
            </div>

            {/* Wallet Connection - Only in Real Mode */}
            {gameMode === 'real' && (
              <>
                {wallet.isConnected ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="gap-2 border-2 border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20"
                      >
                        {getWalletIcon()}
                        <span className="hidden sm:inline font-semibold">{getWalletLabel()}</span>
                        <span className="font-mono text-xs">
                          {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                        </span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">Connected Wallet</p>
                        <p className="text-sm font-semibold">{getWalletLabel()}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          {wallet.address?.slice(0, 10)}...{wallet.address?.slice(-8)}
                        </p>
                        {wallet.balance && (
                          <p className="text-xs text-primary font-semibold mt-1">
                            Balance: {wallet.balance} ETH
                          </p>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDepositClick} className="gap-2 cursor-pointer">
                        <ArrowDownToLine className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">Deposit Funds</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleWithdrawClick} className="gap-2 cursor-pointer">
                        <ArrowUpFromLine className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">Withdraw Funds</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDisconnect} className="gap-2 text-destructive cursor-pointer">
                        <LogOut className="h-4 w-4" />
                        <span className="font-semibold">Disconnect</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="default"
                        className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 font-bold shadow-lg"
                      >
                        <img src="/assets/generated/wallet-icon-transparent.dim_64x64.png" alt="Wallet" className="h-4 w-4" />
                        <span className="hidden sm:inline">Connect Wallet</span>
                        <span className="sm:hidden">Connect</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => handleWalletConnect('walletconnect')} className="gap-2 cursor-pointer">
                        <img src="/assets/generated/walletconnect-logo-transparent.dim_64x64.png" alt="WalletConnect" className="h-5 w-5" />
                        <span className="font-semibold">WalletConnect</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleWalletConnect('coinbase')} className="gap-2 cursor-pointer">
                        <SiCoinbase className="h-5 w-5" />
                        <span className="font-semibold">Coinbase Wallet</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleWalletConnect('metamask')} className="gap-2 cursor-pointer">
                        <img src="/assets/generated/wallet-icon-transparent.dim_64x64.png" alt="MetaMask" className="h-5 w-5" />
                        <span className="font-semibold">MetaMask</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>
        </div>

        {/* Deposit/Withdraw Modals */}
        {gameMode === 'real' && wallet.isConnected && (
          <>
            <DepositWithdrawModal
              open={depositModalOpen}
              onOpenChange={setDepositModalOpen}
              mode="deposit"
              walletBalance={wallet.balance}
            />
            <DepositWithdrawModal
              open={withdrawModalOpen}
              onOpenChange={setWithdrawModalOpen}
              mode="withdraw"
              walletBalance={wallet.balance}
            />
          </>
        )}
      </header>
    </TooltipProvider>
  );
}
