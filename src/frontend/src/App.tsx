import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import LobbyBrowser from './components/LobbyBrowser';
import TournamentSection from './components/TournamentSection';
import WalletSection from './components/WalletSection';
import AdminSettings from './components/AdminSettings';
import QuickPlayGame from './components/QuickPlayGame';
import LivePublishStatus from './components/LivePublishStatus';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

export type GameMode = 'fun' | 'real';

function AppContent() {
  const [gameMode, setGameMode] = useState<GameMode>('fun');
  const [activeTab, setActiveTab] = useState('lobbies');
  const [quickPlayGame, setQuickPlayGame] = useState<{ type: 'spades' | 'omaha4Card' } | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const isAuthenticated = !!identity;

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (actor && isAuthenticated) {
        try {
          const adminStatus = await actor.isCallerAdmin();
          setIsAdmin(adminStatus);
        } catch (error) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [actor, isAuthenticated]);

  const handleQuickPlay = (gameType: 'spades' | 'omaha4Card') => {
    setQuickPlayGame({ type: gameType });
    setGameKey(prev => prev + 1);
  };

  const handleExitGame = () => {
    setQuickPlayGame(null);
    setActiveTab('lobbies');
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setGameMode('fun');
    }
  }, [isAuthenticated]);

  const tabCount = 4 + (isAdmin ? 1 : 0);

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header gameMode={gameMode} onGameModeChange={setGameMode} />

      <main className="flex-1 container mx-auto px-4 py-8">
        {quickPlayGame ? (
          <QuickPlayGame
            key={gameKey}
            gameType={quickPlayGame.type}
            gameMode={gameMode}
            onExit={handleExitGame}
            playerName={userProfile?.name || 'Player'}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-${tabCount} mb-8`}>
              <TabsTrigger value="lobbies">Game Lobbies</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="status">Live Status</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value="lobbies">
              <LobbyBrowser gameMode={gameMode} onQuickPlay={handleQuickPlay} />
            </TabsContent>

            <TabsContent value="tournaments">
              <TournamentSection gameMode={gameMode} />
            </TabsContent>

            <TabsContent value="wallet">
              <WalletSection gameMode={gameMode} />
            </TabsContent>

            <TabsContent value="status">
              <LivePublishStatus />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <AdminSettings />
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>

      <Footer />
      <Toaster />
      <ProfileSetupModal gameMode={gameMode} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
