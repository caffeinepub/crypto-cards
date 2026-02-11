import { OmahaGameState } from './types';
import { canCheck, canCall } from './engine';

export function chooseBotAction(state: OmahaGameState, botId: string): { action: 'fold' | 'check' | 'call' | 'bet'; amount?: number } {
  const bot = state.players.find(p => p.id === botId);
  if (!bot) throw new Error('Bot not found');
  
  // Simple strategy
  const random = Math.random();
  
  if (canCheck(state, botId)) {
    // 70% check, 30% bet
    if (random < 0.7) {
      return { action: 'check' };
    } else {
      // Bet as "raise to" amount (current bet + additional bet)
      const additionalBet = Math.min(50, bot.chips);
      const raiseToAmount = bot.currentBet + additionalBet;
      return { action: 'bet', amount: raiseToAmount };
    }
  }
  
  if (canCall(state, botId)) {
    const callAmount = state.currentBet - bot.currentBet;
    // 60% call, 40% fold
    if (random < 0.6 && callAmount <= bot.chips) {
      return { action: 'call' };
    } else {
      return { action: 'fold' };
    }
  }
  
  // Default: check if possible, otherwise fold
  return { action: 'fold' };
}
