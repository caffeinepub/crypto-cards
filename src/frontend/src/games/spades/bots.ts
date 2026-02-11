import { SpadesGameState, Card } from './types';
import { canPlayCard } from './engine';

export function chooseBotCard(state: SpadesGameState, botId: string): Card {
  const bot = state.players.find(p => p.id === botId);
  if (!bot) throw new Error('Bot not found');
  
  const legalCards = bot.hand.filter(card => canPlayCard(state, botId, card).valid);
  
  if (legalCards.length === 0) {
    throw new Error('No legal cards available');
  }
  
  // Simple strategy: play lowest legal card
  legalCards.sort((a, b) => a.rank - b.rank);
  return legalCards[0];
}
