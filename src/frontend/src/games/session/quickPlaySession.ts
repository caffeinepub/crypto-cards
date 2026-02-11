import { initializeGame as initSpades, playCard as playSpadesCard, submitBid as submitSpadesBid } from '../spades/engine';
import { SpadesGameState } from '../spades/types';
import { chooseBotCard, chooseBotBid } from '../spades/bots';
import { initializeGame as initOmaha, performAction as performOmahaAction, startNextHand as startOmahaNextHand } from '../omaha/engine';
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
  action: 
    | { type: 'playCard'; card: SpadesCard } 
    | { type: 'submitBid'; bid: number }
    | { type: 'omahaAction'; action: 'fold' | 'check' | 'call' | 'bet'; amount?: number }
    | { type: 'omahaNextHand' }
): QuickPlaySession {
  try {
    if (session.gameType === 'spades' && action.type === 'submitBid') {
      const state = session.state as SpadesGameState;
      const newState = submitSpadesBid(state, 'player', action.bid);
      return { ...session, state: newState };
    } else if (session.gameType === 'spades' && action.type === 'playCard') {
      const state = session.state as SpadesGameState;
      const newState = playSpadesCard(state, 'player', action.card);
      return { ...session, state: newState };
    } else if (session.gameType === 'omaha4Card' && action.type === 'omahaAction') {
      const state = session.state as OmahaGameState;
      const newState = performOmahaAction(state, 'player', action.action, action.amount);
      return { ...session, state: newState };
    } else if (session.gameType === 'omaha4Card' && action.type === 'omahaNextHand') {
      const state = session.state as OmahaGameState;
      const newState = startOmahaNextHand(state, Date.now());
      return { ...session, state: newState };
    }
    
    throw new Error('Invalid action for game type');
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

// Single-step bot processing for paced execution
export function executeBotAction(session: QuickPlaySession): QuickPlaySession | null {
  try {
    if (session.gameType === 'spades') {
      const state = session.state as SpadesGameState;
      
      // Check if it's a bot's turn
      if (state.gameOver || !state.players[state.currentPlayerIndex].isBot) {
        return null;
      }
      
      const botId = state.players[state.currentPlayerIndex].id;
      
      // Handle bidding phase
      if (state.biddingPhase) {
        const bid = chooseBotBid(state, botId);
        const newState = submitSpadesBid(state, botId, bid);
        return { ...session, state: newState };
      }
      
      // Handle card play
      const botCard = chooseBotCard(state, botId);
      const newState = playSpadesCard(state, botId, botCard);
      return { ...session, state: newState };
    } else if (session.gameType === 'omaha4Card') {
      const state = session.state as OmahaGameState;
      
      if (state.gameOver || !state.players[state.currentPlayerIndex].isBot) {
        return null;
      }
      
      const botId = state.players[state.currentPlayerIndex].id;
      const botAction = chooseBotAction(state, botId);
      const newState = performOmahaAction(state, botId, botAction.action, botAction.amount);
      return { ...session, state: newState };
    }
    
    return null;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}
