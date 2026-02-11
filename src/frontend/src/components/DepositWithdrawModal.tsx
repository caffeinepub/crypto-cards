import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowDownToLine, ArrowUpFromLine, Loader2, CheckCircle2, XCircle, AlertCircle, Network } from 'lucide-react';
import { toast } from 'sonner';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { 
  useInitiateFlexaDeposit, 
  useGetFlexaDepositsByPrincipal,
  useCancelFlexaDeposit 
} from '../hooks/useQueries';

interface DepositWithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'deposit' | 'withdraw';
  walletBalance: string | null;
}

type DepositStatus = 'idle' | 'initiating' | 'pending' | 'confirmed' | 'failed';

export default function DepositWithdrawModal({ 
  open, 
  onOpenChange, 
  mode,
  walletBalance 
}: DepositWithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'flexa' | 'crypto'>('flexa');
  const [depositStatus, setDepositStatus] = useState<DepositStatus>('idle');
  const [currentDepositId, setCurrentDepositId] = useState<string | null>(null);

  const wallet = useWeb3Wallet();
  const { identity } = useInternetIdentity();
  const initiateDeposit = useInitiateFlexaDeposit();
  const cancelDeposit = useCancelFlexaDeposit();
  
  // Poll for deposit status
  const { data: deposits } = useGetFlexaDepositsByPrincipal(
    identity?.getPrincipal()
  );

  // Check wallet readiness
  const isWalletReady = wallet.isConnected && wallet.isTransactionReady;
  const isOnBaseNetwork = wallet.isOnBaseNetwork;
  const canProceed = isWalletReady && isOnBaseNetwork;

  // Monitor deposit status
  useEffect(() => {
    if (!currentDepositId || !deposits) return;

    const currentDeposit = deposits.find(d => d.depositId === currentDepositId);
    if (!currentDeposit) return;

    // Check status as string since it's an enum
    const statusStr = String(currentDeposit.status);
    
    if (statusStr === 'confirmed') {
      setDepositStatus('confirmed');
      toast.success('Deposit confirmed! Your balance has been updated.');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else if (statusStr === 'failed') {
      setDepositStatus('failed');
      toast.error('Deposit failed. Please try again.');
    } else if (statusStr === 'pending') {
      setDepositStatus('pending');
    }
  }, [deposits, currentDepositId]);

  const handleClose = () => {
    setAmount('');
    setDepositStatus('idle');
    setCurrentDepositId(null);
    onOpenChange(false);
  };

  const handleFlexaDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!wallet.address) {
      toast.error('Wallet not connected');
      return;
    }

    if (!canProceed) {
      toast.error('Wallet not ready for transactions');
      return;
    }

    try {
      setDepositStatus('initiating');
      
      // Convert amount to wei (18 decimals)
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
      
      const intent = await initiateDeposit.mutateAsync({
        amount: amountWei,
        walletAddress: wallet.address,
      });

      setCurrentDepositId(intent.depositId);
      setDepositStatus('pending');
      
      toast.success('Deposit initiated! Waiting for confirmation...');
    } catch (error: any) {
      console.error('[Deposit] Failed to initiate:', error);
      setDepositStatus('failed');
      toast.error(error.message || 'Failed to initiate deposit');
    }
  };

  const handleCancelDeposit = async () => {
    if (!currentDepositId) return;

    try {
      await cancelDeposit.mutateAsync(currentDepositId);
      toast.success('Deposit cancelled');
      handleClose();
    } catch (error: any) {
      console.error('[Deposit] Failed to cancel:', error);
      toast.error(error.message || 'Failed to cancel deposit');
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!canProceed) {
      toast.error('Wallet not ready for transactions');
      return;
    }

    toast.info('Withdrawal functionality coming soon');
  };

  const handleSwitchToBase = async () => {
    await wallet.switchToBase();
  };

  const getProgressValue = () => {
    switch (depositStatus) {
      case 'initiating':
        return 25;
      case 'pending':
        return 50;
      case 'confirmed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'deposit' ? (
              <>
                <ArrowDownToLine className="w-5 h-5" />
                Deposit Funds
              </>
            ) : (
              <>
                <ArrowUpFromLine className="w-5 h-5" />
                Withdraw Funds
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'deposit' 
              ? 'Add funds to your in-game balance' 
              : 'Withdraw funds from your in-game balance'}
          </DialogDescription>
        </DialogHeader>

        {/* Wallet readiness checks */}
        {!isWalletReady && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Open your wallet to complete the connection before proceeding
            </AlertDescription>
          </Alert>
        )}

        {isWalletReady && !isOnBaseNetwork && (
          <Alert>
            <Network className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Switch to Base network to continue</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSwitchToBase}
                className="ml-2"
              >
                Switch to Base
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {mode === 'deposit' && depositStatus === 'idle' && (
          <Tabs value={depositMethod} onValueChange={(v) => setDepositMethod(v as 'flexa' | 'crypto')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flexa">Flexa</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
            </TabsList>

            <TabsContent value="flexa" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!canProceed}
                />
                {walletBalance && (
                  <p className="text-xs text-muted-foreground">
                    Wallet balance: {walletBalance} ETH
                  </p>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  Flexa allows you to deposit using various payment methods including credit cards and bank transfers
                </AlertDescription>
              </Alert>

              <Button
                className="w-full gap-2"
                onClick={handleFlexaDeposit}
                disabled={!canProceed || initiateDeposit.isPending}
              >
                {initiateDeposit.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    Deposit with Flexa
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="crypto" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crypto-amount">Amount (ETH)</Label>
                <Input
                  id="crypto-amount"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!canProceed}
                />
                {walletBalance && (
                  <p className="text-xs text-muted-foreground">
                    Wallet balance: {walletBalance} ETH
                  </p>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  Direct crypto deposits coming soon
                </AlertDescription>
              </Alert>

              <Button
                className="w-full gap-2"
                disabled
              >
                <ArrowDownToLine className="w-4 h-4" />
                Deposit Crypto (Coming Soon)
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {mode === 'deposit' && depositStatus !== 'idle' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Deposit Status</span>
                {depositStatus === 'confirmed' && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {depositStatus === 'failed' && (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                {(depositStatus === 'initiating' || depositStatus === 'pending') && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                )}
              </div>
              <Progress value={getProgressValue()} className="h-2" />
              <p className="text-xs text-muted-foreground capitalize">
                {depositStatus === 'initiating' && 'Initiating deposit...'}
                {depositStatus === 'pending' && 'Waiting for confirmation...'}
                {depositStatus === 'confirmed' && 'Deposit confirmed!'}
                {depositStatus === 'failed' && 'Deposit failed'}
              </p>
            </div>

            {depositStatus === 'pending' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCancelDeposit}
                disabled={cancelDeposit.isPending}
              >
                {cancelDeposit.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Deposit'
                )}
              </Button>
            )}

            {depositStatus === 'failed' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDepositStatus('idle');
                  setCurrentDepositId(null);
                }}
              >
                Try Again
              </Button>
            )}
          </div>
        )}

        {mode === 'withdraw' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (ETH)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.0001"
                placeholder="0.0000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canProceed}
              />
            </div>

            <Alert>
              <AlertDescription>
                Withdrawals will be sent to your connected wallet address
              </AlertDescription>
            </Alert>

            <Button
              className="w-full gap-2"
              onClick={handleWithdraw}
              disabled={!canProceed}
            >
              <ArrowUpFromLine className="w-4 h-4" />
              Withdraw Funds
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
