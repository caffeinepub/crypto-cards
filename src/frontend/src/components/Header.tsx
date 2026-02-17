import React, { useState } from 'react';
import { Button } from './ui/button';
import { Wallet, LogOut, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { WalletPickerModal } from './WalletPickerModal';
import { WalletConnectModal } from './WalletConnectModal';
import WalletInstallModal from './WalletInstallModal';
import { DepositWithdrawModal } from './DepositWithdrawModal';
import { useWeb3WalletContext } from '../contexts/Web3WalletContext';

type GameMode = 'forFun' | 'forReal';

interface HeaderProps {
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
}

export function Header({ gameMode, onGameModeChange }: HeaderProps) {
  const wallet = useWeb3WalletContext();
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleConnectWallet = () => {
    setShowWalletPicker(true);
  };

  const handleDisconnect = () => {
    wallet.disconnect();
  };

  return (
    <>
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Crypto Cards
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile: Dropdown for game mode */}
              <div className="md:hidden">
                <Select value={gameMode} onValueChange={(value) => onGameModeChange(value as GameMode)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forFun">For Fun</SelectItem>
                    <SelectItem value="forReal">For Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop: Segmented toggle */}
              <div className="hidden md:flex items-center gap-1 rounded-lg border bg-muted p-1">
                <Button
                  variant={gameMode === 'forFun' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onGameModeChange('forFun')}
                  className="rounded-md"
                >
                  For Fun
                </Button>
                <Button
                  variant={gameMode === 'forReal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onGameModeChange('forReal')}
                  className="rounded-md"
                >
                  For Real
                </Button>
              </div>

              {/* Wallet Connection */}
              {gameMode === 'forReal' && (
                <>
                  {!wallet.isConnected ? (
                    <Button onClick={handleConnectWallet} size="sm" className="hidden sm:flex">
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="hidden sm:flex">
                          <Wallet className="mr-2 h-4 w-4" />
                          <span className="hidden md:inline">
                            {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Wallet'}
                          </span>
                          <span className="md:hidden">Wallet</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium">Connected Wallet</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {wallet.address ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}` : 'N/A'}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Balance</span>
                            <span className="text-sm font-mono">{wallet.balance || '0.0000'} ETH</span>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowDepositModal(true)}>
                          <ArrowDownToLine className="mr-2 h-4 w-4" />
                          Deposit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowWithdrawModal(true)}>
                          <ArrowUpFromLine className="mr-2 h-4 w-4" />
                          Withdraw
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDisconnect}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {/* Mobile wallet button */}
                  {!wallet.isConnected ? (
                    <Button onClick={handleConnectWallet} size="sm" className="sm:hidden">
                      <Wallet className="h-4 w-4" />
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="sm:hidden">
                          <Wallet className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium">Connected Wallet</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {wallet.address ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}` : 'N/A'}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Balance</span>
                            <span className="text-sm font-mono">{wallet.balance || '0.0000'} ETH</span>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setShowDepositModal(true)}>
                          <ArrowDownToLine className="mr-2 h-4 w-4" />
                          Deposit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowWithdrawModal(true)}>
                          <ArrowUpFromLine className="mr-2 h-4 w-4" />
                          Withdraw
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDisconnect}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showWalletPicker && (
        <WalletPickerModal onClose={() => setShowWalletPicker(false)} />
      )}

      {wallet.showWalletConnectModal && (
        <WalletConnectModal
          onClose={() => wallet.setShowWalletConnectModal(false)}
        />
      )}

      {wallet.walletNotDetected && (
        <WalletInstallModal />
      )}

      {showDepositModal && (
        <DepositWithdrawModal
          type="deposit"
          onClose={() => setShowDepositModal(false)}
        />
      )}

      {showWithdrawModal && (
        <DepositWithdrawModal
          type="withdraw"
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
    </>
  );
}
