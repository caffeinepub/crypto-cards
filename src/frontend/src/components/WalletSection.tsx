import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Trophy, Activity, Info, Wifi, Percent, ArrowDownToLine, ArrowUpFromLine, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GameMode } from '../App';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import { useGetCallerProfile, useGetTransactionHistory, useGetHouseCutPercent, useCheckBalance } from '../hooks/useQueries';
import DepositWithdrawModal from './DepositWithdrawModal';
import LivePublishStatus from './LivePublishStatus';

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalWinnings: number;
  currentBalance: number;
  transactions: Transaction[];
}

interface Transaction {
  txId: string;
  txType: 'deposit' | 'wager' | 'winnings' | 'withdrawal';
  amount: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

interface WalletSectionProps {
  gameMode: GameMode;
}

export default function WalletSection({ gameMode }: WalletSectionProps) {
  const [offlineStats, setOfflineStats] = useState<PlayerStats | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const wallet = useWeb3Wallet();
  
  // Online queries
  const { data: onlineProfile } = useGetCallerProfile();
  const { data: onlineTransactions } = useGetTransactionHistory();
  const { data: houseCutPercent } = useGetHouseCutPercent();
  const { data: currentBalance } = useCheckBalance();

  const guestAddress = sessionStorage.getItem('guestWalletAddress') || 'Not connected';

  // Load offline stats
  useEffect(() => {
    if (gameMode === 'fun') {
      const stored = localStorage.getItem('offlinePlayerStats');
      if (stored) {
        setOfflineStats(JSON.parse(stored));
      } else {
        const defaultStats: PlayerStats = {
          gamesPlayed: 0,
          gamesWon: 0,
          totalWinnings: 0,
          currentBalance: 10000000000000000000,
          transactions: [],
        };
        setOfflineStats(defaultStats);
        localStorage.setItem('offlinePlayerStats', JSON.stringify(defaultStats));
      }
    }
  }, [gameMode]);

  const formatDate = (timestamp: number | bigint) => {
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) / 1000000 : timestamp;
    return new Date(ts).toLocaleString();
  };

  const getTxTypeLabel = (txType: string) => {
    return txType.charAt(0).toUpperCase() + txType.slice(1);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Helper function to get enum value as string
  const getEnumValue = (enumObj: any): string => {
    if (typeof enumObj === 'string') return enumObj;
    if (typeof enumObj === 'object' && enumObj !== null) {
      const keys = Object.keys(enumObj);
      if (keys.length > 0) {
        return keys[0].toLowerCase();
      }
    }
    return 'unknown';
  };

  // Determine which data to display
  const balance = gameMode === 'real' && currentBalance !== undefined
    ? (Number(currentBalance) / 1e18).toFixed(4)
    : offlineStats 
    ? (offlineStats.currentBalance / 1e18).toFixed(4) 
    : '10.0000';

  const totalWinnings = gameMode === 'real' && onlineProfile
    ? (Number(onlineProfile.totalWinnings) / 1e18).toFixed(4)
    : offlineStats 
    ? (offlineStats.totalWinnings / 1e18).toFixed(4) 
    : '0.0000';

  const gamesPlayed = gameMode === 'real' && onlineProfile
    ? Number(onlineProfile.playerStats.gamesPlayed)
    : offlineStats?.gamesPlayed || 0;

  const gamesWon = gameMode === 'real' && onlineProfile
    ? Number(onlineProfile.playerStats.gamesWon)
    : offlineStats?.gamesWon || 0;

  const winRate = gamesPlayed > 0 
    ? ((gamesWon / gamesPlayed) * 100).toFixed(1) 
    : '0.0';

  const transactions = gameMode === 'real' && onlineTransactions
    ? onlineTransactions.map(tx => ({
        txId: tx.txId,
        txType: getEnumValue(tx.txType) as 'deposit' | 'wager' | 'winnings' | 'withdrawal',
        amount: Number(tx.amount),
        timestamp: Number(tx.timestamp),
        status: getEnumValue(tx.status) as 'pending' | 'completed' | 'failed',
      }))
    : offlineStats?.transactions || [];

  const displayAddress = gameMode === 'real' && wallet.address
    ? wallet.address
    : guestAddress;

  const currentHouseCut = houseCutPercent ? Number(houseCutPercent) : 5;

  // Determine if buttons should be enabled - wallet must be connected
  const isRealMode = gameMode === 'real';
  const buttonsEnabled = isRealMode && wallet.isConnected;

  const handleDepositClick = () => {
    if (buttonsEnabled) {
      setDepositModalOpen(true);
    }
  };

  const handleWithdrawClick = () => {
    if (buttonsEnabled) {
      setWithdrawModalOpen(true);
    }
  };

  // Determine tooltip message for disabled buttons
  let depositTooltip = 'Deposit crypto to your in-game balance';
  let withdrawTooltip = 'Withdraw crypto from your in-game balance';
  
  if (!wallet.isConnected) {
    depositTooltip = '⚠️ Connect wallet to deposit funds';
    withdrawTooltip = '⚠️ Connect wallet to withdraw funds';
  } else {
    depositTooltip = '✅ Wallet connected - Click to deposit';
    withdrawTooltip = '✅ Wallet connected - Click to withdraw';
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <img 
                src="/assets/generated/wallet-icon-transparent.dim_64x64.png" 
                alt="Wallet" 
                className="w-8 h-8"
              />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Wallet & Statistics
              </span>
              {gameMode === 'real' && <Wifi className="w-6 h-6 text-green-500" />}
            </h2>
            <p className="text-muted-foreground">
              {gameMode === 'real'
                ? 'View your on-chain balance, stats, and transaction history'
                : 'View your offline balance, stats, and transaction history'}
            </p>
          </div>

          {/* Always visible Deposit/Withdraw buttons - only shown in real mode */}
          {isRealMode && (
            <div className="flex gap-3 w-full sm:w-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 sm:flex-initial">
                    <Button 
                      onClick={handleDepositClick} 
                      disabled={!buttonsEnabled}
                      size="lg"
                      className={`w-full gap-2 transition-all duration-200 font-bold text-base pointer-events-auto ${
                        buttonsEnabled
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/50 border-2 border-green-400 animate-pulse-subtle cursor-pointer'
                          : 'bg-green-600/30 text-white/50 cursor-not-allowed border-2 border-green-600/20'
                      }`}
                    >
                      <ArrowDownToLine className="h-5 w-5" />
                      Deposit
                      {buttonsEnabled && <CheckCircle2 className="h-4 w-4 ml-1" />}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[60]">
                  <p>{depositTooltip}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 sm:flex-initial">
                    <Button 
                      onClick={handleWithdrawClick} 
                      disabled={!buttonsEnabled}
                      size="lg"
                      className={`w-full gap-2 transition-all duration-200 font-bold text-base pointer-events-auto ${
                        buttonsEnabled
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/50 border-2 border-blue-400 cursor-pointer'
                          : 'bg-blue-600/30 text-white/50 cursor-not-allowed border-2 border-blue-600/20'
                      }`}
                    >
                      <ArrowUpFromLine className="h-5 w-5" />
                      Withdraw
                      {buttonsEnabled && <CheckCircle2 className="h-4 w-4 ml-1" />}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[60]">
                  <p>{withdrawTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        <Alert className="border-primary/50 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            {gameMode === 'real' ? (
              <><strong className="text-primary">Live Network Mode</strong> - All data is stored on the Internet Computer blockchain. Real crypto transactions on Base network.</>
            ) : (
              <><strong className="text-accent">Offline Test Mode</strong> - All data is stored locally in your browser. Play against AI bots and track your progress offline.</>
            )}
          </AlertDescription>
        </Alert>

        {gameMode === 'real' && !wallet.isConnected && (
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950 border-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-600 dark:text-amber-400 font-semibold">
              <strong>⚠️ Connect your wallet</strong> to enable deposit and withdrawal functionality.
            </AlertDescription>
          </Alert>
        )}

        {gameMode === 'real' && wallet.isConnected && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950 border-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400 font-bold">
              <strong>✅ Wallet connected!</strong> You can now deposit and withdraw funds.
            </AlertDescription>
          </Alert>
        )}

        {gameMode === 'real' && (
          <Alert className="border-primary/50 bg-primary/5 border-2">
            <Percent className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong className="text-primary">House Cut:</strong> {currentHouseCut}% of all winnings is automatically deducted as platform fee before payout distribution.
            </AlertDescription>
          </Alert>
        )}

        {/* Live Publish Status - only shown in real mode */}
        {isRealMode && (
          <LivePublishStatus />
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In-Game Balance</CardTitle>
              <img src="/assets/generated/balance-display-icon-transparent.dim_64x64.png" alt="Balance" className="h-8 w-8" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{balance} ETH</div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {displayAddress !== 'Not connected' ? `${displayAddress.slice(0, 10)}...${displayAddress.slice(-8)}` : 'Not connected'}
              </p>
              {gameMode === 'fun' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                  ⚠ Simulated balance
                </p>
              )}
              {gameMode === 'real' && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                  ✓ On-chain balance
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/30 bg-gradient-to-br from-card to-accent/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
              <TrendingUp className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{totalWinnings} ETH</div>
              {gameMode === 'real' && (
                <p className="text-xs text-muted-foreground mt-1">
                  After {currentHouseCut}% house cut
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500/30 bg-gradient-to-br from-card to-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Played</CardTitle>
              <Activity className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{gamesPlayed}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-card to-yellow-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Won</CardTitle>
              <Trophy className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{gamesWon}</div>
              {gamesPlayed > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {winRate}% win rate
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="text-primary">Transaction History</CardTitle>
            <CardDescription>
              {gameMode === 'real' 
                ? 'Your on-chain transaction records including deposits, withdrawals, wagers, and payouts'
                : 'Your local transaction records'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="font-bold">Amount</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold">TX ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{getTxTypeLabel(tx.txType)}</TableCell>
                      <TableCell className="font-semibold text-primary">{(tx.amount / 1e18).toFixed(4)} ETH</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(tx.status)}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.txId.slice(0, 10)}...
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No transactions yet</p>
                <p className="text-xs text-muted-foreground mt-2">Start playing to see your transaction history</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deposit/Withdraw Modals - only functional in real mode */}
        {isRealMode && (
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
      </div>
    </TooltipProvider>
  );
}
