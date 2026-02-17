import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertCircle, Loader2, Network } from 'lucide-react';
import { useWeb3WalletContext } from '../contexts/Web3WalletContext';
import { toast } from 'sonner';
import { useInitiateFlexaDeposit, useGetFlexaDepositsByPrincipal } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQuery } from '@tanstack/react-query';
import { Variant_pending_confirmed_failed } from '../backend';

interface DepositWithdrawModalProps {
  type: 'deposit' | 'withdraw';
  onClose: () => void;
}

export function DepositWithdrawModal({ type, onClose }: DepositWithdrawModalProps) {
  const wallet = useWeb3WalletContext();
  const { identity } = useInternetIdentity();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const initiateDeposit = useInitiateFlexaDeposit();
  const { data: deposits = [], refetch: refetchDeposits } = useGetFlexaDepositsByPrincipal(
    identity?.getPrincipal()
  );

  // Poll for deposit status every 2 seconds when there are pending deposits
  useQuery({
    queryKey: ['depositStatus', deposits],
    queryFn: async () => {
      await refetchDeposits();
      return deposits;
    },
    enabled: deposits.some(d => d.status === Variant_pending_confirmed_failed.pending),
    refetchInterval: 2000,
  });

  const handleSwitchToBase = async () => {
    try {
      await wallet.switchToBase();
      toast.success('Switched to Base network');
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch network');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (!wallet.address) {
      toast.error('Wallet address not available');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);

    try {
      if (type === 'deposit') {
        const amountWei = BigInt(Math.floor(amountNum * 1e18));
        const intent = await initiateDeposit.mutateAsync({
          amount: amountWei,
          walletAddress: wallet.address,
        });

        toast.success('Deposit initiated! Waiting for confirmation...');
        console.log('[Deposit] Intent created:', intent);
      } else {
        toast.info('Withdrawal functionality coming soon');
      }
    } catch (err: any) {
      console.error(`[${type}] Failed:`, err);
      toast.error(err.message || `Failed to ${type}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if we can proceed
  const canProceed = wallet.isConnected && wallet.isTransactionReady && wallet.isOnBaseNetwork;

  // Helper function to get status label
  const getStatusLabel = (status: Variant_pending_confirmed_failed): string => {
    switch (status) {
      case Variant_pending_confirmed_failed.pending:
        return 'pending';
      case Variant_pending_confirmed_failed.confirmed:
        return 'confirmed';
      case Variant_pending_confirmed_failed.failed:
        return 'failed';
      default:
        return 'unknown';
    }
  };

  // Helper function to get status color class
  const getStatusColorClass = (status: Variant_pending_confirmed_failed): string => {
    switch (status) {
      case Variant_pending_confirmed_failed.confirmed:
        return 'text-green-600';
      case Variant_pending_confirmed_failed.failed:
        return 'text-red-600';
      case Variant_pending_confirmed_failed.pending:
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{type}</DialogTitle>
          <DialogDescription>
            {type === 'deposit'
              ? 'Add funds to your wallet'
              : 'Withdraw funds from your wallet'}
          </DialogDescription>
        </DialogHeader>

        {!wallet.isConnected && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>Connect your wallet first</p>
          </div>
        )}

        {wallet.isConnected && !wallet.isTransactionReady && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>Open your wallet to complete connection</p>
          </div>
        )}

        {wallet.isConnected && wallet.isTransactionReady && !wallet.isOnBaseNetwork && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <Network className="h-4 w-4 flex-shrink-0" />
              <p>Switch to Base network to continue</p>
            </div>
            <Button onClick={handleSwitchToBase} variant="outline" className="w-full">
              <Network className="mr-2 h-4 w-4" />
              Switch to Base
            </Button>
          </div>
        )}

        {canProceed && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (ETH)</Label>
              <Input
                id="amount"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.0000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available Balance</span>
              <span className="font-mono">{wallet.balance || '0.0000'} ETH</span>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing || !amount}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `${type === 'deposit' ? 'Deposit' : 'Withdraw'}`
                )}
              </Button>
            </div>
          </form>
        )}

        {deposits.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Recent Deposits</h4>
            <div className="space-y-1">
              {deposits.slice(0, 3).map((deposit) => (
                <div
                  key={deposit.depositId}
                  className="flex items-center justify-between rounded-lg border p-2 text-xs"
                >
                  <span className="font-mono">{(Number(deposit.amount) / 1e18).toFixed(4)} ETH</span>
                  <span className={getStatusColorClass(deposit.status)}>
                    {getStatusLabel(deposit.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
