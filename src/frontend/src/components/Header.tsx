import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, ChevronDown, LogOut, ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import WalletInstallModal from './WalletInstallModal';
import WalletConnectModal from './WalletConnectModal';
import WalletPickerModal from './WalletPickerModal';
import DepositWithdrawModal from './DepositWithdrawModal';
import type { GameMode } from '../App';

interface HeaderProps {
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
}

export default function Header({ gameMode, onGameModeChange }: HeaderProps) {
  const wallet = useWeb3Wallet();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [walletPickerOpen, setWalletPickerOpen] = useState(false);

  const handleConnectClick = () => {
    wallet.clearError();
    setWalletPickerOpen(true);
  };

  const handleDisconnect = () => {
    wallet.disconnect();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const gameModeLabel = gameMode === 'forFun' ? 'For Fun' : 'For Real';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/generated/wallet-icon-transparent.dim_64x64.png" 
                alt="Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Crypto Cards
              </h1>
            </div>

            {/* Mobile game mode dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="md:hidden gap-1.5 text-xs"
                >
                  {gameModeLabel}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => onGameModeChange('forFun')}
                  className={gameMode === 'forFun' ? 'bg-accent' : ''}
                >
                  For Fun
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onGameModeChange('forReal')}
                  className={gameMode === 'forReal' ? 'bg-accent' : ''}
                >
                  For Real
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop game mode toggle */}
            <div className="hidden md:flex items-center gap-2 bg-muted rounded-full p-1">
              <Button
                variant={gameMode === 'forFun' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onGameModeChange('forFun')}
                className="rounded-full"
              >
                For Fun
              </Button>
              <Button
                variant={gameMode === 'forReal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onGameModeChange('forReal')}
                className="rounded-full"
              >
                For Real
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {gameMode === 'forReal' && (
              <>
                {!wallet.isConnected ? (
                  <Button
                    onClick={handleConnectClick}
                    disabled={wallet.isConnecting}
                    size="sm"
                    className="gap-1.5 md:gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-xs md:text-sm"
                  >
                    {wallet.isConnecting ? (
                      <>
                        <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                        <span className="hidden sm:inline">Connecting...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Connect Wallet</span>
                        <span className="sm:hidden">Connect</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 md:gap-2 text-xs md:text-sm">
                        <Wallet className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">
                          {formatAddress(wallet.address || '')}
                        </span>
                        {wallet.balance && (
                          <Badge variant="secondary" className="ml-0.5 md:ml-1 text-xs">
                            {wallet.balance} ETH
                          </Badge>
                        )}
                        <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-xs text-muted-foreground">Connected with</p>
                        <p className="text-sm font-medium capitalize">{wallet.selectedWallet}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDepositModalOpen(true)}>
                        <ArrowDownToLine className="w-4 h-4 mr-2" />
                        Deposit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setWithdrawModalOpen(true)}>
                        <ArrowUpFromLine className="w-4 h-4 mr-2" />
                        Withdraw
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDisconnect}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <WalletPickerModal 
        open={walletPickerOpen} 
        onOpenChange={setWalletPickerOpen} 
      />

      <WalletConnectModal
        open={wallet.showWalletConnectModal}
        onOpenChange={wallet.setShowWalletConnectModal}
      />

      <WalletInstallModal />

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
  );
}
