import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useActor } from './hooks/useActor';
import { Header } from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import LobbyBrowser from './components/LobbyBrowser';
import TournamentSection from './components/TournamentSection';
import { WalletSection } from './components/WalletSection';
import AdminSettings from './components/AdminSettings';
import QuickPlayGame from './components/QuickPlayGame';
import WalletInstallModal from './components/WalletInstallModal';
import { Web3WalletProvider } from './contexts/Web3WalletContext';

export type GameMode = 'forFun' | 'forReal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [mode, setMode] = useState<GameMode>('forFun');
  const [activeGame, setActiveGame] = useState<'spades' | 'omaha4Card' | null>(null);

  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (actor && identity) {
        try {
          const adminStatus = await actor.isCallerAdmin();
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Failed to check admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setCheckingAdmin(false);
    };

    checkAdminStatus();
  }, [actor, identity]);

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleQuickPlay = (gameType: 'spades' | 'omaha4Card') => {
    setActiveGame(gameType);
  };

  const handleExitGame = () => {
    setActiveGame(null);
  };

  if (isInitializing || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center colorful-bg-gradient">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col colorful-bg-gradient">
      <Header gameMode={mode} onGameModeChange={setMode} />

      <main className="flex-1 container mx-auto px-4 py-8">
        {activeGame ? (
          <QuickPlayGame
            gameType={activeGame}
            gameMode={mode}
            onExit={handleExitGame}
            playerName={userProfile?.name || 'Player'}
          />
        ) : (
          <Tabs defaultValue="quick-play" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="quick-play">Quick Play</TabsTrigger>
              <TabsTrigger value="lobbies">Lobbies</TabsTrigger>
              <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
            </TabsList>

            <TabsContent value="quick-play" className="space-y-6">
              <LobbyBrowser gameMode={mode} onQuickPlay={handleQuickPlay} />
            </TabsContent>

            <TabsContent value="lobbies" className="space-y-6">
              <LobbyBrowser gameMode={mode} onQuickPlay={handleQuickPlay} />
            </TabsContent>

            <TabsContent value="tournaments" className="space-y-6">
              <TournamentSection gameMode={mode} />
            </TabsContent>

            <TabsContent value="wallet" className="space-y-6">
              <WalletSection gameMode={mode} />
            </TabsContent>
          </Tabs>
        )}

        {isAdmin && (
          <div className="mt-8">
            <AdminSettings />
          </div>
        )}
      </main>

      <Footer />

      <ProfileSetupModal gameMode={mode} />
      
      <WalletInstallModal />

      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3WalletProvider>
        <AppContent />
      </Web3WalletProvider>
    </QueryClientProvider>
  );
}
