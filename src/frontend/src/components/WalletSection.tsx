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

  // Get wallet balance for modal (if available)
  const walletBalance = wallet.balance || null;

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
                Wallet & Stats
              </span>
            </h2>
            <p className="text-muted-foreground mt-1">
              {gameMode === 'real' ? 'Manage your on-chain balance and view your stats' : 'View your offline game statistics'}
            </p>
          </div>
          {gameMode === 'real' && (
            <Badge variant="outline" className="gap-2 px-3 py-1.5">
              <Wifi className="h-3 w-3" />
              <span className="font-semibold">Live Network</span>
            </Badge>
          )}
        </div>

        {/* Balance Card */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="/assets/generated/balance-display-icon-transparent.dim_64x64.png" 
                alt="Balance" 
                className="w-6 h-6"
              />
              Current Balance
            </CardTitle>
            <CardDescription>
              {gameMode === 'real' ? 'Your on-chain balance on Base network' : 'Your offline play balance'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {balance}
              </span>
              <span className="text-2xl text-muted-foreground font-semibold">ETH</span>
            </div>
            
            {gameMode === 'real' && (
              <div className="flex flex-wrap gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        onClick={handleDepositClick}
                        disabled={!buttonsEnabled}
                        className="gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                        Deposit
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{depositTooltip}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        onClick={handleWithdrawClick}
                        disabled={!buttonsEnabled}
                        variant="outline"
                        className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUpFromLine className="h-4 w-4" />
                        Withdraw
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{withdrawTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {gameMode === 'real' && !wallet.isConnected && (
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-600 dark:text-amber-400">
                  <strong>Wallet not connected.</strong> Connect your wallet to deposit or withdraw funds.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                <strong>Wallet Address:</strong>
                <div className="font-mono mt-1 break-all">{displayAddress}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{totalWinnings} ETH</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Won</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gamesWon}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {gamesPlayed} games played
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Success rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* House Cut Info */}
        {gameMode === 'real' && (
          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Percent className="h-4 w-4" />
                Platform Fee
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The platform takes a small percentage of each wager to maintain the service</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-accent">{currentHouseCut}%</span>
                <span className="text-sm text-muted-foreground">per wager</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {gameMode === 'real' ? 'Your recent on-chain transactions' : 'Your offline game transactions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm mt-1">
                  {gameMode === 'real' ? 'Start playing to see your transaction history' : 'Play some games to build your history'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 10).map((tx) => (
                      <TableRow key={tx.txId}>
                        <TableCell className="font-medium">
                          {getTxTypeLabel(tx.txType)}
                        </TableCell>
                        <TableCell>
                          {(tx.amount / 1e18).toFixed(4)} ETH
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(tx.status)}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tx.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <DepositWithdrawModal
          open={depositModalOpen}
          onOpenChange={setDepositModalOpen}
          mode="deposit"
          walletBalance={walletBalance}
        />
        <DepositWithdrawModal
          open={withdrawModalOpen}
          onOpenChange={setWithdrawModalOpen}
          mode="withdraw"
          walletBalance={walletBalance}
        />
      </div>
    </TooltipProvider>
  );
}
