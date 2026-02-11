import { SpadesGameState, Card } from './types';
import { canPlayCard } from './engine';

export function chooseBotCard(state: SpadesGameState, botId: string): Card {
  const bot = state.players.find(p => p.id === botId);
  if (!bot) throw new Error('Bot not found');
  
  const trick = state.currentTrick;
  
  // If there's a lead suit, bot must follow suit if possible
  if (trick.leadSuit && trick.cards.length > 0) {
    const suitCards = bot.hand.filter(card => card.suit === trick.leadSuit);
    if (suitCards.length > 0) {
      // Play lowest card of the lead suit
      suitCards.sort((a, b) => a.rank - b.rank);
      return suitCards[0];
    }
  }
  
  // Otherwise, get all legal cards
  const legalCards = bot.hand.filter(card => canPlayCard(state, botId, card).valid);
  
  if (legalCards.length === 0) {
    throw new Error('No legal cards available');
  }
  
  // Simple strategy: play lowest legal card
  legalCards.sort((a, b) => a.rank - b.rank);
  return legalCards[0];
}

export function chooseBotBid(state: SpadesGameState, botId: string): number {
  const bot = state.players.find(p => p.id === botId);
  if (!bot) throw new Error('Bot not found');
  
  // Simple heuristic: count high cards and spades
  let bid = 0;
  
  // Count aces and kings
  const highCards = bot.hand.filter(c => c.rank >= 13);
  bid += highCards.length;
  
  // Count spades (trump suit)
  const spades = bot.hand.filter(c => c.suit === 'spades');
  bid += Math.floor(spades.length / 3);
  
  // Ensure bid is between 0 and 13
  return Math.min(Math.max(bid, 0), 13);
}
