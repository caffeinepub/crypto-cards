import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Trophy, Activity, Info, Wifi, Percent, ArrowDownToLine, ArrowUpFromLine, AlertCircle, CheckCircle2, Network } from 'lucide-react';
import type { GameMode } from '../App';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import { useGetHouseCutPercent, useCheckBalance } from '../hooks/useQueries';
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
  
  // Online queries - these return placeholder data since backend methods aren't implemented
  const { data: houseCutPercent } = useGetHouseCutPercent();
  const { data: currentBalance } = useCheckBalance();

  const guestAddress = sessionStorage.getItem('guestWalletAddress') || 'Not connected';

  // Load offline stats
  useEffect(() => {
    if (gameMode === 'forFun') {
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

  // Determine which data to display
  const balance = gameMode === 'forReal' && currentBalance !== undefined
    ? (Number(currentBalance) / 1e18).toFixed(4)
    : offlineStats 
    ? (offlineStats.currentBalance / 1e18).toFixed(4) 
    : '10.0000';

  const totalWinnings = offlineStats 
    ? (offlineStats.totalWinnings / 1e18).toFixed(4) 
    : '0.0000';

  const gamesPlayed = offlineStats?.gamesPlayed || 0;
  const gamesWon = offlineStats?.gamesWon || 0;

  const winRate = gamesPlayed > 0 
    ? ((gamesWon / gamesPlayed) * 100).toFixed(1) 
    : '0.0';

  const transactions = offlineStats?.transactions || [];

  const displayAddress = gameMode === 'forReal' && wallet.address
    ? wallet.address
    : guestAddress;

  const currentHouseCut = houseCutPercent ? Number(houseCutPercent) : 5;

  // Determine if buttons should be enabled
  const isRealMode = gameMode === 'forReal';
  const isWalletConnected = isRealMode && wallet.isConnected;
  const isTransactionReady = isWalletConnected && wallet.isTransactionReady;
  const isOnBaseNetwork = wallet.isOnBaseNetwork;

  // Determine button states and messages
  let depositDisabled = true;
  let withdrawDisabled = true;
  let depositMessage = '';
  let withdrawMessage = '';

  if (!isRealMode) {
    depositDisabled = true;
    withdrawDisabled = true;
  } else if (!isWalletConnected) {
    depositDisabled = true;
    withdrawDisabled = true;
    depositMessage = 'Connect your wallet to deposit funds';
    withdrawMessage = 'Connect your wallet to withdraw funds';
  } else if (!isTransactionReady) {
    depositDisabled = true;
    withdrawDisabled = true;
    depositMessage = 'Open your wallet to complete connection';
    withdrawMessage = 'Open your wallet to complete connection';
  } else if (!isOnBaseNetwork) {
    depositDisabled = true;
    withdrawDisabled = true;
    depositMessage = 'Switch to Base network to deposit';
    withdrawMessage = 'Switch to Base network to withdraw';
  } else {
    depositDisabled = false;
    withdrawDisabled = false;
    depositMessage = '';
    withdrawMessage = '';
  }

  const handleDepositClick = () => {
    if (!depositDisabled) {
      setDepositModalOpen(true);
    }
  };

  const handleWithdrawClick = () => {
    if (!withdrawDisabled) {
      setWithdrawModalOpen(true);
    }
  };

  const handleSwitchToBase = async () => {
    await wallet.switchToBase();
  };

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
              {gameMode === 'forReal' ? 'Manage your on-chain balance and view your stats' : 'View your offline game statistics'}
            </p>
          </div>
          {gameMode === 'forReal' && (
            <Badge variant="default" className="bg-green-600 gap-2">
              <Wifi className="w-3 h-3" />
              Live Network
            </Badge>
          )}
        </div>

        {/* Balance Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="/assets/generated/balance-display-icon-transparent.dim_64x64.png" 
                alt="Balance" 
                className="w-6 h-6"
              />
              {gameMode === 'forReal' ? 'Your on-chain balance on Base network' : 'Your offline play balance'}
            </CardTitle>
            <CardDescription>
              Available funds for wagering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-4xl font-bold text-primary">
                {balance} ETH
              </div>
              
              {gameMode === 'forReal' && (
                <>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1">
                          <Button
                            onClick={handleDepositClick}
                            disabled={depositDisabled}
                            className="w-full gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <ArrowDownToLine className="w-4 h-4" />
                            Deposit
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {depositMessage && (
                        <TooltipContent>
                          <p>{depositMessage}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1">
                          <Button
                            onClick={handleWithdrawClick}
                            disabled={withdrawDisabled}
                            variant="outline"
                            className="w-full gap-2"
                          >
                            <ArrowUpFromLine className="w-4 h-4" />
                            Withdraw
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {withdrawMessage && (
                        <TooltipContent>
                          <p>{withdrawMessage}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>

                  {/* Connection status alerts */}
                  {!isWalletConnected && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Connect your wallet to deposit or withdraw funds
                      </AlertDescription>
                    </Alert>
                  )}

                  {isWalletConnected && !isTransactionReady && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Open your wallet to complete the connection and enable transactions
                      </AlertDescription>
                    </Alert>
                  )}

                  {isWalletConnected && isTransactionReady && !isOnBaseNetwork && (
                    <Alert>
                      <Network className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>Switch to Base network to deposit or withdraw</span>
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

                  {isWalletConnected && isTransactionReady && isOnBaseNetwork && (
                    <Alert className="border-green-500/50 bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        Wallet ready for transactions on Base network
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wallet Address:</span>
                  <span className="font-mono text-xs">
                    {displayAddress.slice(0, 6)}...{displayAddress.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    House Cut:
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Platform fee taken from winnings</p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="font-semibold flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {currentHouseCut}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Total Winnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {totalWinnings} ETH
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Games Played
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {gamesPlayed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {winRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {gamesWon} wins
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        {gameMode === 'forReal' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img 
                  src="/assets/generated/transaction-history-bg.dim_400x200.png" 
                  alt="Transactions" 
                  className="w-6 h-6"
                />
                Transaction History
              </CardTitle>
              <CardDescription>
                {gameMode === 'forReal' ? 'Your recent on-chain transactions' : 'Your offline game transactions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    {gameMode === 'forReal' ? 'Start playing to see your transaction history' : 'Play some games to build your history'}
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
                              {tx.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
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
        )}
      </div>

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
    </TooltipProvider>
  );
}
