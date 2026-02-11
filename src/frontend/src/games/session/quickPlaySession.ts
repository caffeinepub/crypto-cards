import { initializeGame as initSpades, playCard as playSpadesCard } from '../spades/engine';
import { SpadesGameState } from '../spades/types';
import { chooseBotCard } from '../spades/bots';
import { initializeGame as initOmaha, performAction as performOmahaAction } from '../omaha/engine';
import { OmahaGameState } from '../omaha/types';
import { chooseBotAction } from '../omaha/bots';
import { Card as SpadesCard } from '../spades/types';

export type GameType = 'spades' | 'omaha4Card';
export type GameState = SpadesGameState | OmahaGameState;

export interface QuickPlaySession {
  gameType: GameType;
  state: GameState;
}

export function createSession(gameType: GameType, playerName: string): QuickPlaySession {
  const seed = Date.now();
  
  if (gameType === 'spades') {
    return {
      gameType: 'spades',
      state: initSpades(playerName, seed),
    };
  } else {
    return {
      gameType: 'omaha4Card',
      state: initOmaha(playerName, seed),
    };
  }
}

export function executeAction(
  session: QuickPlaySession,
  action: { type: 'playCard'; card: SpadesCard } | { type: 'omahaAction'; action: 'fold' | 'check' | 'call' | 'bet'; amount?: number }
): QuickPlaySession {
  try {
    if (session.gameType === 'spades' && action.type === 'playCard') {
      const state = session.state as SpadesGameState;
      let newState = playSpadesCard(state, 'player', action.card);
      
      // Process bot turns
      while (!newState.gameOver && newState.players[newState.currentPlayerIndex].isBot) {
        const botId = newState.players[newState.currentPlayerIndex].id;
        const botCard = chooseBotCard(newState, botId);
        newState = playSpadesCard(newState, botId, botCard);
      }
      
      return { ...session, state: newState };
    } else if (session.gameType === 'omaha4Card' && action.type === 'omahaAction') {
      const state = session.state as OmahaGameState;
      let newState = performOmahaAction(state, 'player', action.action, action.amount);
      
      // Process bot turns
      while (!newState.gameOver && newState.players[newState.currentPlayerIndex].isBot) {
        const botId = newState.players[newState.currentPlayerIndex].id;
        const botAction = chooseBotAction(newState, botId);
        newState = performOmahaAction(newState, botId, botAction.action, botAction.amount);
      }
      
      return { ...session, state: newState };
    }
    
    throw new Error('Invalid action for game type');
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}
