import { useState, useCallback, useRef, useEffect } from 'react';
import { createSession, executeAction, executeBotAction, QuickPlaySession, GameType } from '../games/session/quickPlaySession';
import { Card as SpadesCard, SpadesGameState } from '../games/spades/types';
import { OmahaGameState } from '../games/omaha/types';
import { toast } from 'sonner';
import { sleep } from '../utils/sleep';

const BOT_ACTION_DELAY = 600; // milliseconds between bot actions
const MAX_BOT_ITERATIONS = 100; // Safety cap to prevent infinite loops

export function useQuickPlaySession() {
  const [session, setSession] = useState<QuickPlaySession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const processBotActions = useCallback(async (currentSession: QuickPlaySession) => {
    let workingSession = currentSession;
    let iterations = 0;
    
    // Process bot actions one at a time with delays
    while (iterations < MAX_BOT_ITERATIONS) {
      const nextSession = executeBotAction(workingSession);
      if (!nextSession) break;
      
      await sleep(BOT_ACTION_DELAY);
      workingSession = nextSession;
      setSession(workingSession);
      iterations++;
    }
    
    if (iterations >= MAX_BOT_ITERATIONS) {
      console.warn('Bot processing hit safety cap');
    }
    
    return workingSession;
  }, []);

  // Auto-process bot turns whenever session updates
  useEffect(() => {
    if (!session || processingRef.current) return;

    const shouldProcessBots = 
      (session.gameType === 'spades' || session.gameType === 'omaha4Card') &&
      !session.state.gameOver &&
      session.state.players[session.state.currentPlayerIndex]?.isBot;

    if (shouldProcessBots) {
      processingRef.current = true;
      setIsProcessing(true);
      
      processBotActions(session)
        .then(() => {
          processingRef.current = false;
          setIsProcessing(false);
        })
        .catch((error) => {
          console.error('Bot processing error:', error);
          processingRef.current = false;
          setIsProcessing(false);
        });
    }
  }, [session, processBotActions]);

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

  const submitBid = useCallback(async (bid: number) => {
    if (!session || session.gameType !== 'spades' || isProcessing || processingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);
    try {
      const oldState = session.state as SpadesGameState;
      
      if (!oldState.biddingPhase) {
        throw new Error('Bidding phase is over');
      }
      
      // Submit player's bid
      const newSession = executeAction(session, { type: 'submitBid', bid });
      setSession(newSession);
      
      // Bot processing will be handled by useEffect
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid bid';
      toast.error(message);
      processingRef.current = false;
      setIsProcessing(false);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [session, isProcessing]);

  const playCard = useCallback(async (card: SpadesCard) => {
    if (!session || session.gameType !== 'spades' || isProcessing || processingRef.current) return;
    
    processingRef.current = true;
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
      
      // Bot processing will be handled by useEffect
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid move';
      toast.error(message);
      processingRef.current = false;
      setIsProcessing(false);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [session, isProcessing]);

  const performOmahaAction = useCallback(async (action: 'fold' | 'check' | 'call' | 'bet', amount?: number) => {
    if (!session || session.gameType !== 'omaha4Card' || isProcessing || processingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);
    try {
      // Perform player's action
      const newSession = executeAction(session, { type: 'omahaAction', action, amount });
      setSession(newSession);
      
      // Bot processing will be handled by useEffect
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid action';
      toast.error(message);
      processingRef.current = false;
      setIsProcessing(false);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [session, isProcessing]);

  const startOmahaNextHand = useCallback(async () => {
    if (!session || session.gameType !== 'omaha4Card' || isProcessing || processingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);
    try {
      const newSession = executeAction(session, { type: 'omahaNextHand' });
      setSession(newSession);
      toast.success('New hand started!');
      
      // Bot processing will be handled by useEffect
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start next hand';
      toast.error(message);
      processingRef.current = false;
      setIsProcessing(false);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [session, isProcessing]);

  const resetGame = useCallback(() => {
    setSession(null);
    setIsProcessing(false);
    processingRef.current = false;
  }, []);

  return {
    session,
    isProcessing,
    startGame,
    submitBid,
    playCard,
    performOmahaAction,
    startOmahaNextHand,
    resetGame,
  };
}
