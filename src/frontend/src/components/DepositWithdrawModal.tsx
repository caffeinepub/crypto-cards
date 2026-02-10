import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, CheckCircle2, ArrowDownToLine, ArrowUpFromLine, Smartphone, QrCode, X } from 'lucide-react';
import { useDepositFunds, useRequestWithdrawal, useCheckBalance, useFlexaPaymentConfirmation, useFlexaDepositStatus, useCancelFlexaDeposit } from '../hooks/useQueries';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import { toast } from 'sonner';

interface DepositWithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'deposit' | 'withdraw';
  walletBalance?: string | null;
}

// Detect if user is on mobile device
function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Generate mock Flexa transaction ID
function generateFlexaTransactionId(): string {
  return `flexa_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export default function DepositWithdrawModal({
  open,
  onOpenChange,
  mode,
  walletBalance,
}: DepositWithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showFlexaFlow, setShowFlexaFlow] = useState(false);
  const [flexaDepositId, setFlexaDepositId] = useState<string | null>(null);
  const [flexaPollingEnabled, setFlexaPollingEnabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wallet = useWeb3Wallet();

  const { data: currentBalance, refetch: refetchBalance } = useCheckBalance();
  const depositMutation = useDepositFunds();
  const withdrawMutation = useRequestWithdrawal();
  const flexaConfirmationMutation = useFlexaPaymentConfirmation();
  const cancelFlexaMutation = useCancelFlexaDeposit();

  // Real-time polling for Flexa deposit status
  const { data: flexaStatus } = useFlexaDepositStatus(flexaDepositId, flexaPollingEnabled);

  const isDeposit = mode === 'deposit';
  const mutation = isDeposit ? depositMutation : withdrawMutation;
  const isMobile = isMobileDevice();

  // Handle Flexa status changes with real-time notifications
  useEffect(() => {
    if (!flexaStatus || !flexaDepositId) return;

    if (flexaStatus === 'confirmed') {
      // Stop polling
      setFlexaPollingEnabled(false);
      
      // Show success notification
      toast.success('✅ Flexa Payment Confirmed!', {
        description: 'Your deposit has been confirmed and your balance has been updated.',
        duration: 5000,
      });
      
      // Refresh balance
      refetchBalance();
      
      // Mark as success
      setSuccess(true);
      setAmount('');
      setShowFlexaFlow(false);
      
      // Close modal after delay
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFlexaDepositId(null);
      }, 2000);
    } else if (flexaStatus === 'failed') {
      // Stop polling
      setFlexaPollingEnabled(false);
      
      // Show error notification
      toast.error('❌ Flexa Payment Failed', {
        description: 'Your Flexa payment could not be processed. Please try again.',
        duration: 5000,
      });
      
      setError('Flexa payment failed - please try again');
      setFlexaDepositId(null);
    }
  }, [flexaStatus, flexaDepositId, refetchBalance, onOpenChange]);

  // Autofocus on input when modal opens
  useEffect(() => {
    if (open && inputRef.current && !showFlexaFlow) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, showFlexaFlow]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setError(null);
      setValidationError(null);
      setSuccess(false);
      setShowFlexaFlow(false);
      setFlexaDepositId(null);
      setFlexaPollingEnabled(false);
    }
  }, [open]);

  // Live validation
  useEffect(() => {
    setValidationError(null);
    
    if (!amount || amount.trim() === '') {
      return;
    }

    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum)) {
      setValidationError('Please enter a valid number');
      return;
    }

    if (amountNum <= 0) {
      setValidationError('Amount must be greater than 0');
      return;
    }

    // Validation for withdrawal
    if (!isDeposit && currentBalance !== undefined) {
      const amountWei = BigInt(Math.floor(amountNum * 1e18));
      if (amountWei > currentBalance) {
        const availableEth = (Number(currentBalance) / 1e18).toFixed(4);
        setValidationError(`Insufficient balance. Available: ${availableEth} ETH`);
        return;
      }
    }

    // Validation for deposit
    if (isDeposit && walletBalance) {
      const walletBalanceNum = parseFloat(walletBalance);
      if (amountNum > walletBalanceNum) {
        setValidationError(`Insufficient wallet balance. Available: ${walletBalance} ETH`);
        return;
      }
    }
  }, [amount, isDeposit, currentBalance, walletBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Check wallet connection
    if (!wallet.isConnected || !wallet.address) {
      setError('Wallet not connected. Please connect your wallet first.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    // Convert ETH to Wei (1 ETH = 10^18 Wei)
    const amountWei = BigInt(Math.floor(amountNum * 1e18));

    // Validation for withdrawal
    if (!isDeposit && currentBalance !== undefined) {
      if (amountWei > currentBalance) {
        setError(`Insufficient balance. You have ${(Number(currentBalance) / 1e18).toFixed(4)} ETH available.`);
        return;
      }
    }

    // Validation for deposit
    if (isDeposit && walletBalance) {
      const walletBalanceNum = parseFloat(walletBalance);
      if (amountNum > walletBalanceNum) {
        setError(`Insufficient wallet balance. You have ${walletBalance} ETH in your wallet.`);
        return;
      }
    }

    try {
      await mutation.mutateAsync({ amount: amountWei, walletAddress: wallet.address });
      setSuccess(true);
      setAmount('');
      
      // Refetch balance immediately after successful transaction
      await refetchBalance();
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.message || 'Transaction failed';
      if (errorMessage.includes('Insufficient balance')) {
        setError('Insufficient balance for this transaction');
      } else if (errorMessage.includes('Unauthorized')) {
        setError('You must be logged in to perform this action');
      } else if (errorMessage.includes('Backend not connected')) {
        setError('Connection to backend lost. Please refresh and try again.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleFlexaPayment = () => {
    setShowFlexaFlow(true);
    setError(null);
  };

  const handleFlexaInitiate = async () => {
    if (!amount || !wallet.address) {
      setError('Please enter an amount and connect your wallet');
      toast.error('❌ Invalid Input', {
        description: 'Please enter an amount and connect your wallet',
      });
      return;
    }

    setError(null);

    try {
      const amountNum = parseFloat(amount);
      const amountWei = BigInt(Math.floor(amountNum * 1e18));

      // Generate Flexa deposit ID
      const depositId = generateFlexaTransactionId();
      setFlexaDepositId(depositId);

      // Show processing toast
      toast.loading('Processing Flexa payment...', {
        id: 'flexa-processing',
        description: 'Initiating your Flexa transaction...',
      });

      // Initiate Flexa deposit on backend
      await flexaConfirmationMutation.mutateAsync({ 
        depositId,
        amount: amountWei, 
        walletAddress: wallet.address!
      });

      // Dismiss processing toast
      toast.dismiss('flexa-processing');

      // Start polling for status
      setFlexaPollingEnabled(true);

      // Show pending notification
      toast.info('⏳ Flexa Payment Pending', {
        description: 'Waiting for payment confirmation. This may take a few moments...',
        duration: 10000,
      });

    } catch (err: any) {
      toast.dismiss('flexa-processing');
      const errorMessage = err.message || 'Flexa payment failed';
      setError(errorMessage);
      setFlexaDepositId(null);
      
      toast.error('❌ Flexa Payment Failed', {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleFlexaDeepLink = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      toast.error('❌ Invalid Amount', {
        description: 'Please enter a valid amount greater than 0',
      });
      return;
    }

    // Generate Flexa SPEDN deep link with prefilled amount
    const flexaDeepLink = `flexa://pay?amount=${amountNum}&currency=ETH&recipient=${wallet.address || ''}`;
    
    // Show processing toast
    toast.loading('Opening Flexa SPEDN app...', {
      id: 'flexa-deeplink',
      description: 'Complete the payment in your Flexa app',
    });
    
    // Open deep link
    window.location.href = flexaDeepLink;
    
    // Dismiss toast after delay
    setTimeout(() => {
      toast.dismiss('flexa-deeplink');
    }, 3000);
    
    // Initiate Flexa payment after user returns
    setTimeout(() => {
      handleFlexaInitiate();
    }, 5000);
  };

  const handleCancelFlexa = async () => {
    if (!flexaDepositId) return;

    try {
      await cancelFlexaMutation.mutateAsync(flexaDepositId);
      setFlexaPollingEnabled(false);
      setFlexaDepositId(null);
      setShowFlexaFlow(false);
      setError(null);
    } catch (err: any) {
      // Error already handled by mutation
    }
  };

  const handleClose = () => {
    if (!mutation.isPending && !flexaPollingEnabled) {
      setAmount('');
      setError(null);
      setValidationError(null);
      setSuccess(false);
      setShowFlexaFlow(false);
      setFlexaDepositId(null);
      setFlexaPollingEnabled(false);
      onOpenChange(false);
    }
  };

  const currentBalanceEth = currentBalance !== undefined ? (Number(currentBalance) / 1e18).toFixed(4) : '0.0000';

  // Determine if button should be enabled
  const amountNum = parseFloat(amount);
  const hasValidAmount = !isNaN(amountNum) && amountNum > 0 && amount.trim() !== '';
  const hasNoValidationError = !validationError;
  const isWalletConnected = wallet.isConnected && wallet.address;
  const isNotProcessing = !mutation.isPending && !success && !flexaPollingEnabled;
  
  const isButtonEnabled = isWalletConnected && hasValidAmount && hasNoValidationError && isNotProcessing;

  // Determine tooltip message for disabled state
  let tooltipMessage = '';
  if (!wallet.isConnected) {
    tooltipMessage = 'Please connect your wallet first';
  } else if (!amount || amount.trim() === '') {
    tooltipMessage = 'Enter an amount to continue';
  } else if (!hasValidAmount) {
    tooltipMessage = 'Enter a valid positive amount';
  } else if (validationError) {
    tooltipMessage = validationError;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] z-[100]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isDeposit ? (
              <>
                <ArrowDownToLine className="h-6 w-6 text-green-500" />
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Deposit Funds
                </span>
              </>
            ) : (
              <>
                <ArrowUpFromLine className="h-6 w-6 text-blue-500" />
                <span className="bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                  Withdraw Funds
                </span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isDeposit
              ? 'Transfer cryptocurrency from your Base wallet to your in-game balance.'
              : 'Cash out your in-game balance to your Base wallet.'}
          </DialogDescription>
        </DialogHeader>

        {showFlexaFlow && isDeposit ? (
          // Flexa Payment Flow
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/assets/generated/flexa-logo-transparent.dim_100x40.png" 
                alt="Flexa" 
                className="h-10"
              />
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Pay with Flexa
              </h3>
              <p className="text-sm text-muted-foreground">
                Amount: <span className="font-bold text-primary">{amount} ETH</span>
              </p>
              {flexaDepositId && (
                <p className="text-xs text-muted-foreground font-mono">
                  Transaction ID: {flexaDepositId.slice(0, 20)}...
                </p>
              )}
              {flexaStatus === 'pending' && (
                <div className="flex items-center justify-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Waiting for payment confirmation...</span>
                </div>
              )}
            </div>

            {isMobile ? (
              // Mobile: Deep Link
              <div className="space-y-4">
                <Alert className="border-2 border-purple-500 bg-purple-50 dark:bg-purple-950">
                  <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <AlertDescription className="text-purple-600 dark:text-purple-400 font-semibold">
                    Tap the button below to open Flexa SPEDN app with your payment amount prefilled.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleFlexaDeepLink}
                  disabled={flexaPollingEnabled}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-base py-6"
                >
                  {flexaPollingEnabled ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Flexa Payment...
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-2 h-5 w-5" />
                      Open Flexa SPEDN App
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // Desktop: QR Code
              <div className="space-y-4">
                <Alert className="border-2 border-purple-500 bg-purple-50 dark:bg-purple-950">
                  <QrCode className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <AlertDescription className="text-purple-600 dark:text-purple-400 font-semibold">
                    Scan this QR code with your Flexa SPEDN mobile app to complete the payment.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center p-6 bg-white dark:bg-gray-900 rounded-lg border-2 border-purple-500">
                  <img 
                    src="/assets/generated/flexa-qr-placeholder.dim_200x200.png" 
                    alt="Flexa QR Code" 
                    className="w-48 h-48"
                  />
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  After scanning, complete the payment in your Flexa app. Your balance will update automatically.
                </p>

                <Button
                  onClick={handleFlexaInitiate}
                  disabled={flexaPollingEnabled}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                >
                  {flexaPollingEnabled ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Flexa Payment...
                    </>
                  ) : (
                    'I\'ve Completed Payment'
                  )}
                </Button>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFlexaFlow(false);
                  setError(null);
                }}
                disabled={flexaPollingEnabled}
                className="flex-1"
              >
                Back to Deposit Options
              </Button>
              
              {flexaPollingEnabled && flexaDepositId && (
                <Button
                  variant="destructive"
                  onClick={handleCancelFlexa}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Payment
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Standard Deposit/Withdraw Form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-base font-semibold">Amount (ETH)</Label>
              <Input
                ref={inputRef}
                id="amount"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.0000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={mutation.isPending || success}
                className={`font-mono text-lg ${validationError ? 'border-red-500 focus-visible:ring-red-500' : 'border-primary/50 focus-visible:ring-primary'}`}
              />
              
              {/* Live validation feedback */}
              {validationError && amount && (
                <p className="text-sm text-red-500 flex items-center gap-1 font-semibold">
                  <AlertCircle className="h-3 w-3" />
                  {validationError}
                </p>
              )}
              
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className="font-semibold">In-game balance: <span className="text-accent">{currentBalanceEth} ETH</span></span>
                {walletBalance && <span className="font-semibold">Wallet: <span className="text-primary">{walletBalance} ETH</span></span>}
              </div>
              
              {wallet.address ? (
                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-semibold bg-green-50 dark:bg-green-950 p-2 rounded">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected: {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                </div>
              ) : (
                <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-950 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  Wallet not connected
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-2 border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400 font-bold text-base">
                  {isDeposit ? '✅ Deposit successful! Balance updated.' : '✅ Withdrawal request submitted!'}
                </AlertDescription>
              </Alert>
            )}

            {isDeposit && (
              <>
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground font-semibold">
                    Alternative Payment Method
                  </p>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            type="button"
                            onClick={handleFlexaPayment}
                            disabled={!hasValidAmount || !isWalletConnected}
                            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-bold text-lg py-7 border-2 border-purple-400 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <img 
                              src="/assets/generated/flexa-logo-transparent.dim_100x40.png" 
                              alt="Flexa" 
                              className="h-6 mr-3"
                            />
                            Pay with Flexa
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {(!hasValidAmount || !isWalletConnected) && (
                        <TooltipContent>
                          <p>{!isWalletConnected ? 'Connect wallet first' : 'Enter a valid amount'}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Fast, secure payments powered by Flexa
                  </p>
                </div>
              </>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isPending || success}
                className="hover:bg-accent hover:text-accent-foreground active:bg-accent/80 transition-all duration-200 border-2 pointer-events-auto cursor-pointer"
              >
                Cancel
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full sm:w-auto">
                      <Button 
                        type="submit" 
                        disabled={!isButtonEnabled}
                        className={`w-full sm:w-auto transition-all duration-200 font-bold text-base pointer-events-auto ${
                          isButtonEnabled
                            ? isDeposit
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/50 border-2 border-green-400 animate-pulse-subtle cursor-pointer' 
                              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/50 border-2 border-blue-400 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed bg-gray-600'
                        }`}
                      >
                        {mutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : success ? (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Success!
                          </>
                        ) : (
                          <>
                            {isDeposit ? (
                              <>
                                <ArrowDownToLine className="mr-2 h-5 w-5" />
                                Deposit Now
                              </>
                            ) : (
                              <>
                                <ArrowUpFromLine className="mr-2 h-5 w-5" />
                                Withdraw Now
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!isButtonEnabled && tooltipMessage && (
                    <TooltipContent>
                      <p>{tooltipMessage}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
