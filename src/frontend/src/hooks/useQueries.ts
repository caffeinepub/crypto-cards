import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { 
  UserProfile, 
  CanisterBuildMetadata,
  FlexaDeposit,
  FlexaDepositIntent
} from '../backend';
import { Principal } from '@icp-sdk/core/principal';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Canister Build Metadata
export function useGetCanisterBuildMetadata() {
  const { actor, isFetching } = useActor();

  return useQuery<CanisterBuildMetadata>({
    queryKey: ['canisterBuildMetadata'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCanisterBuildMetadata();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

// Flexa Deposit Queries
export function useInitiateFlexaDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, walletAddress }: { amount: bigint; walletAddress: string }) => {
      if (!actor) throw new Error('Actor not available');
      const intent = await actor.initiateFlexaDeposit(amount, walletAddress);
      return intent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flexaDeposits'] });
    },
  });
}

export function useGetFlexaDepositsByPrincipal(principal?: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<FlexaDeposit[]>({
    queryKey: ['flexaDeposits', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getDepositsByPrincipal(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
    refetchInterval: 2000, // Poll every 2 seconds for status updates
  });
}

export function useGetFlexaDepositsByWallet(walletAddress?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<FlexaDeposit[]>({
    queryKey: ['flexaDeposits', 'wallet', walletAddress],
    queryFn: async () => {
      if (!actor || !walletAddress) return [];
      return actor.getDepositsByWallet(walletAddress);
    },
    enabled: !!actor && !isFetching && !!walletAddress,
    refetchInterval: 2000, // Poll every 2 seconds
  });
}

export function useCancelFlexaDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (depositId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.cancelDeposit(depositId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flexaDeposits'] });
    },
  });
}

// Admin function to update deposit status (for testing)
export function useUpdateFlexaDepositStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ depositId, status }: { depositId: string; status: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateFlexaDepositStatus(depositId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flexaDeposits'] });
    },
  });
}

// Placeholder queries for features not yet implemented in backend
export function useGetCallerProfile() {
  return useQuery({
    queryKey: ['callerProfile'],
    queryFn: async () => null,
    enabled: false,
  });
}

export function useGetTransactionHistory() {
  return useQuery({
    queryKey: ['transactionHistory'],
    queryFn: async () => [],
    enabled: false,
  });
}

export function useGetHouseCutPercent() {
  return useQuery({
    queryKey: ['houseCutPercent'],
    queryFn: async () => 5,
    enabled: false,
  });
}

export function useCheckBalance() {
  return useQuery({
    queryKey: ['balance'],
    queryFn: async () => BigInt(0),
    enabled: false,
  });
}
