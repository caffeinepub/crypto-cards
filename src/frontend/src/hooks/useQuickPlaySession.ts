import { useState, useCallback } from 'react';
import { createSession, executeAction, executeBotAction, QuickPlaySession, GameType } from '../games/session/quickPlaySession';
import { Card as SpadesCard, SpadesGameState } from '../games/spades/types';
import { toast } from 'sonner';
import { sleep } from '../utils/sleep';

const BOT_ACTION_DELAY = 600; // milliseconds between bot actions

export function useQuickPlaySession() {
  const [session, setSession] = useState<QuickPlaySession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startGame = useCallback((gameType: GameType, playerName: string) => {
    try {
      const newSession = createSession(gameType, playerName);
      setSession(newSession);
      toast.success(`${gameType === 'spades' ? 'Spades' : 'Pot Limit Omaha'} game started!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start game';
      toast.error(message);
    }
  }, []);

  const processBotActions = useCallback(async (currentSession: QuickPlaySession) => {
    let workingSession = currentSession;
    
    // Process bot actions one at a time with delays
    while (true) {
      const nextSession = executeBotAction(workingSession);
      if (!nextSession) break;
      
      await sleep(BOT_ACTION_DELAY);
      workingSession = nextSession;
      setSession(workingSession);
    }
    
    return workingSession;
  }, []);

  const submitBid = useCallback(async (bid: number) => {
    if (!session || session.gameType !== 'spades' || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const oldState = session.state as SpadesGameState;
      
      if (!oldState.biddingPhase) {
        throw new Error('Bidding phase is over');
      }
      
      // Submit player's bid
      const newSession = executeAction(session, { type: 'submitBid', bid });
      setSession(newSession);
      
      // Process bot bids with pacing
      const finalSession = await processBotActions(newSession);
      setSession(finalSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid bid';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [session, isProcessing, processBotActions]);

  const playCard = useCallback(async (card: SpadesCard) => {
    if (!session || session.gameType !== 'spades' || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const oldState = session.state as SpadesGameState;
      const oldPenaltyCount = oldState.renegePenalties.length;
      
      // Play player's card
      const newSession = executeAction(session, { type: 'playCard', card });
      const newState = newSession.state as SpadesGameState;
      const newPenaltyCount = newState.renegePenalties.length;
      
      // Check if new reneging penalties were added
      if (newPenaltyCount > oldPenaltyCount) {
        const newPenalties = newState.renegePenalties.slice(oldPenaltyCount);
        newPenalties.forEach(penalty => {
          toast.error(`${penalty.playerName}: ${penalty.message}`);
        });
      }
      
      setSession(newSession);
      
      // Process bot actions with pacing
      const finalSession = await processBotActions(newSession);
      setSession(finalSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid move';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [session, isProcessing, processBotActions]);

  const performOmahaAction = useCallback(async (action: 'fold' | 'check' | 'call' | 'bet', amount?: number) => {
    if (!session || session.gameType !== 'omaha4Card' || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Perform player's action
      const newSession = executeAction(session, { type: 'omahaAction', action, amount });
      setSession(newSession);
      
      // Process bot actions with pacing
      const finalSession = await processBotActions(newSession);
      setSession(finalSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid action';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [session, isProcessing, processBotActions]);

  const resetGame = useCallback(() => {
    setSession(null);
    setIsProcessing(false);
  }, []);

  return {
    session,
    isProcessing,
    startGame,
    submitBid,
    playCard,
    performOmahaAction,
    resetGame,
  };
}
