import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Info } from 'lucide-react';
import { toast } from 'sonner';
import { GameMode } from '../App';
import { useWeb3Wallet } from '../hooks/useWeb3Wallet';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface ProfileSetupModalProps {
  gameMode: GameMode;
}

export default function ProfileSetupModal({ gameMode }: ProfileSetupModalProps) {
  const [username, setUsername] = useState('');
  const [showModal, setShowModal] = useState(false);
  const wallet = useWeb3Wallet();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();

  // Generate or retrieve guest wallet address
  const guestWalletAddress = (() => {
    let address = sessionStorage.getItem('guestWalletAddress');
    if (!address) {
      address = '0x' + Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      sessionStorage.setItem('guestWalletAddress', address);
    }
    return address;
  })();

  const currentAddress = wallet.address || guestWalletAddress;

  // Check if profile exists
  useEffect(() => {
    if (gameMode === 'real' && isAuthenticated && isFetched && !profileLoading && userProfile === null) {
      setShowModal(true);
      setUsername(`Player_${currentAddress.slice(2, 8)}`);
    } else if (gameMode === 'fun') {
      const hasProfile = localStorage.getItem('offlineUserProfile');
      if (!hasProfile) {
        setShowModal(true);
        setUsername(`Guest_${guestWalletAddress.slice(2, 8)}`);
      }
    }
  }, [gameMode, userProfile, profileLoading, isFetched, isAuthenticated, currentAddress, guestWalletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    if (gameMode === 'real') {
      // Online mode - save to backend
      try {
        await saveProfileMutation.mutateAsync({
          name: username.trim(),
          walletAddress: currentAddress,
        });

        toast.success('Profile created successfully on network!');
        setShowModal(false);
      } catch (error: any) {
        toast.error(error.message || 'Failed to create profile');
      }
    } else {
      // Offline mode - save to local storage
      const profile = {
        name: username.trim(),
        walletAddress: guestWalletAddress,
        createdAt: Date.now(),
      };
      localStorage.setItem('offlineUserProfile', JSON.stringify(profile));

      // Initialize player stats
      const playerStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        totalWinnings: 0,
        currentBalance: 10000000000000000000, // 10 ETH in wei
        transactions: [],
      };
      localStorage.setItem('offlinePlayerStats', JSON.stringify(playerStats));

      toast.success('Profile created successfully!');
      setShowModal(false);
    }
  };

  return (
    <Dialog open={showModal}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to Crypto Cards!</DialogTitle>
          <DialogDescription>
            {gameMode === 'real' 
              ? 'Set up your player profile for multiplayer gaming'
              : 'Set up your player profile to start playing offline'}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {gameMode === 'real' ? (
              <><strong>Live Network Mode:</strong> Your profile will be stored on the Internet Computer blockchain. Play with real players and crypto wagers!</>
            ) : (
              <><strong>Offline Test Mode:</strong> All data is stored locally in your browser. Play against AI bots instantly!</>
            )}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              This name will be visible to other players
            </p>
          </div>

          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-mono break-all">
                {currentAddress}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {gameMode === 'real' 
                ? 'Your connected wallet on Base network'
                : 'Simulated wallet for offline mode'}
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={saveProfileMutation.isPending}
          >
            {saveProfileMutation.isPending 
              ? 'Creating Profile...' 
              : 'Create Profile & Start Playing'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
