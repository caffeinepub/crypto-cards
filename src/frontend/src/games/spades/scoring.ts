import { Player } from './types';

export const TARGET_SCORE = 500;
export const RENEGE_PENALTY = -100;

/**
 * Calculate hand score for a player based on their bid and tricks won.
 * Standard Spades scoring:
 * - Make bid: 10 * bid + overtricks (bags)
 * - Fail bid: -10 * bid
 * - Nil bid (0): +100 if made, -100 if failed
 */
export function calculateHandScore(player: Player): number {
  const bid = player.bid ?? 0;
  const tricksWon = player.tricksWon;

  // Nil bid (bid 0)
  if (bid === 0) {
    return tricksWon === 0 ? 100 : -100;
  }

  // Made bid
  if (tricksWon >= bid) {
    const baseScore = bid * 10;
    const overtricks = tricksWon - bid; // bags
    return baseScore + overtricks;
  }

  // Failed bid
  return -bid * 10;
}

/**
 * Check if any player has reached the target score
 */
export function hasReachedTarget(players: Player[]): boolean {
  return players.some(p => (p.totalScore ?? 0) >= TARGET_SCORE);
}

/**
 * Determine the winner when multiple players reach 500+
 * Returns the player with the highest total score
 * In case of tie, returns the first player in the list (deterministic)
 */
export function determineWinner(players: Player[]): Player {
  let winner = players[0];
  let maxScore = winner.totalScore ?? 0;

  for (let i = 1; i < players.length; i++) {
    const score = players[i].totalScore ?? 0;
    if (score > maxScore) {
      maxScore = score;
      winner = players[i];
    }
  }

  return winner;
}
