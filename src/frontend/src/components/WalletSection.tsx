import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, AlertCircle, Network } from 'lucide-react';
import { DepositWithdrawModal } from './DepositWithdrawModal';
import { useWeb3WalletContext } from '../contexts/Web3WalletContext';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

type GameMode = 'forFun' | 'forReal';

interface WalletSectionProps {
  gameMode: GameMode;
}

export function WalletSection({ gameMode }: WalletSectionProps) {
  const wallet = useWeb3WalletContext();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Only show wallet section in real mode
  if (gameMode !== 'forReal') {
    return null;
  }

  const handleSwitchToBase = async () => {
    try {
      await wallet.switchToBase();
      toast.success('Switched to Base network');
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch network');
    }
  };

  const handleDepositClick = () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!wallet.isTransactionReady) {
      toast.error('Please open your wallet to complete connection');
      return;
    }
    if (!wallet.isOnBaseNetwork) {
      toast.error('Please switch to Base network first');
      return;
    }
    setShowDepositModal(true);
  };

  const handleWithdrawClick = () => {
    if (!wallet.isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!wallet.isTransactionReady) {
      toast.error('Please open your wallet to complete connection');
      return;
    }
    if (!wallet.isOnBaseNetwork) {
      toast.error('Please switch to Base network first');
      return;
    }
    setShowWithdrawModal(true);
  };

  // Determine what to show based on wallet state
  const renderWalletContent = () => {
    // Not connected at all
    if (!wallet.isConnected) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Connect your wallet to deposit and play for real</p>
          </div>
        </div>
      );
    }

    // Connected but not transaction ready
    if (!wallet.isTransactionReady) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address</span>
            <span className="font-mono text-sm">
              {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Open your wallet to complete connection</p>
          </div>
        </div>
      );
    }

    // Connected and transaction ready but wrong network
    if (!wallet.isOnBaseNetwork) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address</span>
            <span className="font-mono text-sm">
              {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="font-mono text-sm">{wallet.balance || '0.0000'} ETH</span>
          </div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <Network className="h-4 w-4" />
            <p className="text-sm">Switch to Base network to deposit/withdraw</p>
          </div>
          <Button onClick={handleSwitchToBase} variant="outline" className="w-full">
            <Network className="mr-2 h-4 w-4" />
            Switch to Base
          </Button>
        </div>
      );
    }

    // Fully connected, ready, and on Base network
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Address</span>
          <span className="font-mono text-sm">
            {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Balance</span>
          <span className="font-mono text-sm">{wallet.balance || '0.0000'} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Network</span>
          <Badge variant="outline" className="text-xs">
            Base
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleDepositClick}
            variant="default"
            size="sm"
            className="w-full"
          >
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Deposit
          </Button>
          <Button
            onClick={handleWithdrawClick}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <ArrowUpFromLine className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderWalletContent()}
        </CardContent>
      </Card>

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
