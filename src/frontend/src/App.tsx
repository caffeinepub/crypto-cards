import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import LobbyBrowser from './components/LobbyBrowser';
import TournamentSection from './components/TournamentSection';
import WalletSection from './components/WalletSection';
import AdminSettings from './components/AdminSettings';
import ProfileSetupModal from './components/ProfileSetupModal';
import QuickPlayGame from './components/QuickPlayGame';
import WalletInstallModal from './components/WalletInstallModal';
import WalletConnectModal from './components/WalletConnectModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWeb3Wallet } from './hooks/useWeb3Wallet';
import { useQuery } from '@tanstack/react-query';
import { useActorWithRetry } from './hooks/useActorWithRetry';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

export type GameMode = 'fun' | 'real';

function AppContent() {
  const [activeTab, setActiveTab] = useState('lobbies');
  const [quickPlayGame, setQuickPlayGame] = useState<'spades' | 'omaha4Card' | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('fun');
  const wallet = useWeb3Wallet();
  const { actor, isConnected } = useActorWithRetry();

  // Check if caller is admin
  const { data: isAdmin } = useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor || !isConnected) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && isConnected,
  });

  // Auto-connect wallet on mount (only once)
  useEffect(() => {
    const initWallet = async () => {
      await wallet.autoConnect();
    };
    initWallet();
  }, []); // Empty dependency array - only run once on mount

  const handleQuickPlay = (gameType: 'spades' | 'omaha4Card') => {
    setGameKey(prev => prev + 1);
    setQuickPlayGame(gameType);
  };

  const handleExitGame = () => {
    setQuickPlayGame(null);
    setActiveTab('lobbies');
  };

  const handleModeChange = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'real' && !wallet.isConnected) {
      // Prompt to connect wallet for real mode
      wallet.connect('coinbase');
    }
  };

  if (quickPlayGame) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className="flex min-h-screen flex-col bg-background">
          <Header gameMode={gameMode} onGameModeChange={handleModeChange} />
          <main className="flex-1 container mx-auto px-4 py-8">
            <QuickPlayGame 
              key={gameKey}
              gameType={quickPlayGame} 
              gameMode={gameMode}
              onExit={handleExitGame} 
            />
          </main>
          <Footer />
          <Toaster />
          <WalletInstallModal />
          <WalletConnectModal 
            open={wallet.showWalletConnectModal} 
            onOpenChange={wallet.setShowWalletConnectModal}
          />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="flex min-h-screen flex-col bg-background">
        <Header gameMode={gameMode} onGameModeChange={handleModeChange} />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <ProfileSetupModal gameMode={gameMode} />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full max-w-2xl mx-auto ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'} mb-8`}>
              <TabsTrigger value="lobbies">Game Lobbies</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="wallet">Wallet & Stats</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value="lobbies" className="space-y-6">
              <LobbyBrowser gameMode={gameMode} onQuickPlay={handleQuickPlay} />
            </TabsContent>

            <TabsContent value="tournaments" className="space-y-6">
              <TournamentSection gameMode={gameMode} />
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6">
              <WalletSection gameMode={gameMode} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="space-y-6">
                <AdminSettings />
              </TabsContent>
            )}
          </Tabs>
        </main>

        <Footer />
        <Toaster />
        <WalletInstallModal />
        <WalletConnectModal 
          open={wallet.showWalletConnectModal} 
          onOpenChange={wallet.setShowWalletConnectModal}
        />
      </div>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
