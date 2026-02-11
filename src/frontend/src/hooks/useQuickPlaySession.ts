import { useState, useCallback } from 'react';
import { createSession, executeAction, QuickPlaySession, GameType } from '../games/session/quickPlaySession';
import { Card as SpadesCard } from '../games/spades/types';
import { toast } from 'sonner';

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

  const playCard = useCallback((card: SpadesCard) => {
    if (!session || session.gameType !== 'spades' || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const newSession = executeAction(session, { type: 'playCard', card });
      setSession(newSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid move';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [session, isProcessing]);

  const performOmahaAction = useCallback((action: 'fold' | 'check' | 'call' | 'bet', amount?: number) => {
    if (!session || session.gameType !== 'omaha4Card' || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const newSession = executeAction(session, { type: 'omahaAction', action, amount });
      setSession(newSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid action';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [session, isProcessing]);

  const resetGame = useCallback(() => {
    setSession(null);
    setIsProcessing(false);
  }, []);

  return {
    session,
    isProcessing,
    startGame,
    playCard,
    performOmahaAction,
    resetGame,
  };
}
