import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActorWithRetry } from './useActorWithRetry';
import type { 
  UserProfile,
  UserRole,
  CanisterBuildMetadata,
} from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { toast } from 'sonner';

// Define types that are not exported from backend but are used in the frontend
export type PlayerProfile = {
  walletAddress: string;
  playerStats: PlayerStats;
  transactionHistory: TransactionRecord[];
  totalWinnings: bigint;
  currentBalance: bigint;
  flopsSeenStats: FlopsSeenStats;
};

export type PlayerStats = {
  gamesPlayed: bigint;
  gamesWon: bigint;
  totalWinnings: bigint;
  currentBalance: bigint;
  flopsSeen: bigint;
  flopsTotalHands: bigint;
};

export type TransactionRecord = {
  txId: string;
  txType: { __kind__: 'deposit' | 'wager' | 'winnings' | 'withdrawal' };
  amount: bigint;
  timestamp: bigint;
  status: { __kind__: 'pending' | 'completed' | 'failed' };
};

export type FlopsSeenStats = {
  flopsTotalHands: bigint;
  flopsSeen: bigint;
};

export type MatchmakingResult = {
  lobbyId: bigint;
  profileCreated: boolean;
  playersFound: bigint;
  botsAdded: bigint;
  status: string;
};

export type Lobby = {
  id: bigint;
  creator: Principal;
  wagerAmount: bigint;
  maxPlayers: bigint;
  players: Principal[];
  isActive: boolean;
  chatMessages: ChatMessage[];
  botCount: bigint;
  gameType: Variant_omaha4Card_spades;
  mode: Variant_forReal_forFun;
  waitingForPlayers: boolean;
  createdAt: bigint;
};

export type Tournament = {
  id: bigint;
  creator: Principal;
  entryFee: bigint;
  participants: Principal[];
  rounds: bigint;
  isActive: boolean;
  leaderboard: LeaderboardEntry[];
  gameType: Variant_omaha4Card_spades;
};

export type ChatMessage = {
  sender: Principal;
  message: string;
  timestamp: bigint;
};

export type LeaderboardEntry = {
  player: Principal;
  totalWinnings: bigint;
};

export type AdminStats = {
  activeLobbies: bigint;
  activeTournaments: bigint;
  totalWagers: bigint;
  platformBalance: bigint;
  houseCutPercent: bigint;
};

export type Variant_omaha4Card_spades = 'omaha4Card' | 'spades';
export type Variant_forReal_forFun = 'forReal' | 'forFun';

export type LobbyWithAutoProfileResult = {
  lobbyId: bigint;
  profileCreated: boolean;
};

export type StartLobbyResult = {
  __kind__: 'forFunOnly' | 'realPlayStarted';
  value?: bigint;
};

export type FlexaDepositStatus = 'pending' | 'confirmed' | 'failed';

// ===========================
// ==== CANISTER BUILD METADATA
// ===========================
export function useGetCanisterBuildMetadata() {
  const { actor, isFetching: actorFetching, isConnected } = useActorWithRetry();

  return useQuery<CanisterBuildMetadata>({
    queryKey: ['canisterBuildMetadata'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCanisterBuildMetadata();
    },
    enabled: !!actor && !actorFetching && isConnected,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
    staleTime: 60000, // Cache for 1 minute
  });
}

// ===========================
// ==== USER PROFILE =========
// ===========================
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching, isConnected } = useActorWithRetry();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && isConnected,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

// ===========================
// ==== PLAYER PROFILE =======
// ===========================
export function useGetCallerProfile() {
  const { actor, isFetching, isConnected } = useActorWithRetry();

  return useQuery<PlayerProfile | null>({
    queryKey: ['callerProfile'],
    queryFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      const profile = await actor.getPlayerProfile();
      return profile;
    },
    enabled: !!actor && !isFetching && isConnected,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

export function useCreateProfile() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walletAddress: string) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      return actor.createPlayerProfile(walletAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['flopsSeenStats'] });
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

// ===========================
// ==== FLOPS SEEN STATS =====
// ===========================
export function useGetFlopsSeenStats(player?: Principal) {
  const { actor, isFetching, isConnected } = useActorWithRetry();

  return useQuery<FlopsSeenStats>({
    queryKey: ['flopsSeenStats', player?.toString()],
    queryFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      
      // Mock return
      return {
        flopsTotalHands: BigInt(0),
        flopsSeen: BigInt(0),
      };
    },
    enabled: !!actor && !isFetching && isConnected,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

export function useRecordNewOmahaHand() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      // Mock implementation
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flopsSeenStats'] });
      queryClient.invalidateQueries({ queryKey: ['callerProfile'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

export function useRecordFlopSeen() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      // Mock implementation
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flopsSeenStats'] });
      queryClient.invalidateQueries({ queryKey: ['callerProfile'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

export function useRecordAllHandsSeen() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lobbyId, flopSeenPlayers }: { lobbyId: bigint; flopSeenPlayers: Principal[] }) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      // Mock implementation
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flopsSeenStats'] });
      queryClient.invalidateQueries({ queryKey: ['callerProfile'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

// ===========================
// ==== BALANCE & FUNDS ======
// ===========================
export function useCheckBalance() {
  const { actor, isFetching, isConnected } = useActorWithRetry();

  return useQuery<bigint>({
    queryKey: ['balance'],
    queryFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      return actor.getBalance();
    },
    enabled: !!actor && !isFetching && isConnected,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

export function useDepositFunds() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, walletAddress }: { amount: bigint; walletAddress: string }) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      
      // Show processing toast
      toast.loading('Processing deposit...', {
        id: 'deposit-processing',
        description: 'Please wait while we process your transaction.',
      });
      
      const txId = await actor.depositFunds(amount, walletAddress);
      return { txId, amount };
    },
    onSuccess: (result) => {
      // Dismiss processing toast
      toast.dismiss('deposit-processing');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['callerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      
      const amountEth = (Number(result.amount) / 1e18).toFixed(4);
      toast.success('✅ Deposit Successful!', {
        description: `${amountEth} ETH has been added to your in-game balance.`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      // Dismiss processing toast
      toast.dismiss('deposit-processing');
      
      const errorMessage = error.message || 'Deposit failed';
      let description = errorMessage;
      
      if (errorMessage.includes('Insufficient balance')) {
        description = 'You do not have enough balance for this deposit.';
      } else if (errorMessage.includes('Unauthorized')) {
        description = 'You must be logged in to perform this action.';
      } else if (errorMessage.includes('Backend not connected')) {
        description = 'Connection to backend lost. Please refresh and try again.';
      } else if (errorMessage.includes('Player profile not found')) {
        description = 'Player profile not found. Please create a profile first.';
      }
      
      toast.error('❌ Deposit Failed', {
        description,
        duration: 5000,
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

// ===========================
// ==== FLEXA PAYMENT ========
// ===========================

export function useInitiateFlexaDeposit() {
  const { actor, isConnected } = useActorWithRetry();

  return useMutation({
    mutationFn: async ({ 
      depositId, 
      amount, 
      walletAddress 
    }: { 
      depositId: string; 
      amount: bigint; 
      walletAddress: string;
    }) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      
      await actor.initiateFlexaDeposit(depositId, amount, walletAddress);
      return { depositId, amount };
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to initiate Flexa deposit';
      toast.error('❌ Flexa Deposit Failed', {
        description: errorMessage,
        duration: 5000,
      });
    },
  });
}

export function useFlexaDepositStatus(depositId: string | null, enabled: boolean = true) {
  const { actor, isFetching, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useQuery<FlexaDepositStatus | null>({
    queryKey: ['flexaDepositStatus', depositId],
    queryFn: async () => {
      if (!actor || !isConnected || !depositId) return null;
      
      const status = await actor.getFlexaDepositStatus(depositId);
      if (!status) return null;
      
      // Convert backend enum to string
      if ('__kind__' in status) {
        return status.__kind__ as FlexaDepositStatus;
      }
      return status as FlexaDepositStatus;
    },
    enabled: !!actor && !isFetching && isConnected && !!depositId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 2 seconds while pending, stop when confirmed or failed
      if (data === 'pending') return 2000;
      
      // If status changed to confirmed or failed, invalidate balance queries
      if (data === 'confirmed' || data === 'failed') {
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['callerProfile'] });
        queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      }
      
      return false;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

export function useFlexaPaymentConfirmation() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      depositId,
      amount, 
      walletAddress
    }: { 
      depositId: string;
      amount: bigint; 
      walletAddress: string;
    }) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      
      // Initiate the Flexa deposit first
      await actor.initiateFlexaDeposit(depositId, amount, walletAddress);
      
      // Return deposit info for polling
      return { depositId, amount, walletAddress };
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['callerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Flexa payment failed';
      let description = errorMessage;
      
      if (errorMessage.includes('Insufficient balance')) {
        description = 'Flexa payment failed - insufficient balance.';
      } else if (errorMessage.includes('Unauthorized')) {
        description = 'You must be logged in to complete Flexa payments.';
      } else if (errorMessage.includes('Backend not connected')) {
        description = 'Connection to backend lost. Please refresh and try again.';
      } else if (errorMessage.includes('Player profile not found')) {
        description = 'Player profile not found. Please create a profile first.';
      }
      
      toast.error('❌ Flexa Payment Failed', {
        description,
        duration: 5000,
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

export function useCancelFlexaDeposit() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (depositId: string) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      await actor.cancelFlexaDeposit(depositId);
      return depositId;
    },
    onSuccess: (depositId) => {
      queryClient.invalidateQueries({ queryKey: ['flexaDepositStatus', depositId] });
      toast.info('Flexa deposit cancelled', {
        description: 'Your Flexa deposit has been cancelled.',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to cancel Flexa deposit';
      toast.error('❌ Cancellation Failed', {
        description: errorMessage,
        duration: 5000,
      });
    },
  });
}

export function useRequestWithdrawal() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, walletAddress }: { amount: bigint; walletAddress: string }) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      
      // Show processing toast
      toast.loading('Processing withdrawal...', {
        id: 'withdrawal-processing',
        description: 'Please wait while we process your transaction.',
      });
      
      const txId = await actor.requestWithdrawal(amount, walletAddress);
      return { txId, amount };
    },
    onSuccess: (result) => {
      // Dismiss processing toast
      toast.dismiss('withdrawal-processing');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['callerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      
      const amountEth = (Number(result.amount) / 1e18).toFixed(4);
      toast.success('✅ Withdrawal Successful!', {
        description: `${amountEth} ETH withdrawal has been submitted. Funds will be processed shortly.`,
        duration: 5000,
      });
    },
    onError: (error: any) => {
      // Dismiss processing toast
      toast.dismiss('withdrawal-processing');
      
      const errorMessage = error.message || 'Withdrawal failed';
      let description = errorMessage;
      
      if (errorMessage.includes('Insufficient balance')) {
        description = 'You do not have enough balance for this withdrawal.';
      } else if (errorMessage.includes('Unauthorized')) {
        description = 'You must be logged in to perform this action.';
      } else if (errorMessage.includes('Backend not connected')) {
        description = 'Connection to backend lost. Please refresh and try again.';
      } else if (errorMessage.includes('Player profile not found')) {
        description = 'Player profile not found. Please create a profile first.';
      }
      
      toast.error('❌ Withdrawal Failed', {
        description,
        duration: 5000,
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

// ===========================
// ==== TRANSACTION HISTORY ==
// ===========================
export function useGetTransactionHistory() {
  const { actor, isFetching, isConnected } = useActorWithRetry();

  return useQuery<TransactionRecord[]>({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !isFetching && isConnected,
    refetchInterval: 10000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

// ===========================
// ==== LOBBY MANAGEMENT =====
// ===========================
export function useGetActiveLobbies() {
  const { actor, isFetching, isConnected } = useActorWithRetry();

  return useQuery<Lobby[]>({
    queryKey: ['activeLobbies'],
    queryFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      // Mock implementation - return empty array
      return [];
    },
    enabled: !!actor && !isFetching && isConnected,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

export function useGetLobby(lobbyId: bigint | null) {
  const { actor, isFetching, isConnected } = useActorWithRetry();

  return useQuery<Lobby | null>({
    queryKey: ['lobby', lobbyId?.toString()],
    queryFn: async () => {
      if (!actor || !isConnected || !lobbyId) return null;
      // Mock implementation
      return null;
    },
    enabled: !!actor && !isFetching && isConnected && !!lobbyId,
    refetchInterval: 2000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

export function useCreateLobby() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      wagerAmount, 
      maxPlayers, 
      gameType 
    }: { 
      wagerAmount: bigint; 
      maxPlayers: bigint; 
      gameType: Variant_omaha4Card_spades;
    }) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      // Mock implementation
      return BigInt(1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeLobbies'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

export function useJoinLobby() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lobbyId: bigint) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      // Mock implementation
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeLobbies'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

export function useLeaveLobby() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lobbyId: bigint) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      // Mock implementation
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeLobbies'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

// ===========================
// ==== TOURNAMENT ===========
// ===========================
export function useGetActiveTournaments() {
  const { actor, isFetching, isConnected } = useActorWithRetry();

  return useQuery<Tournament[]>({
    queryKey: ['activeTournaments'],
    queryFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      // Mock implementation
      return [];
    },
    enabled: !!actor && !isFetching && isConnected,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

// ===========================
// ==== ADMIN ================
// ===========================
export function useGetHouseCutPercent() {
  const { actor, isFetching, isConnected } = useActorWithRetry();

  return useQuery<bigint>({
    queryKey: ['houseCutPercent'],
    queryFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      return actor.getHouseCutPercent();
    },
    enabled: !!actor && !isFetching && isConnected,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}

export function useSetHouseCut() {
  const { actor, isConnected } = useActorWithRetry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (percent: bigint) => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      return actor.setHouseCut(percent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['houseCutPercent'] });
      toast.success('House cut updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update house cut', {
        description: error.message || 'An error occurred',
      });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
  });
}

export function useGetAdminStats() {
  const { actor, isFetching, isConnected } = useActorWithRetry();

  return useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      if (!actor || !isConnected) throw new Error('Backend not connected');
      return actor.getAdminStats();
    },
    enabled: !!actor && !isFetching && isConnected,
    refetchInterval: 5000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}
