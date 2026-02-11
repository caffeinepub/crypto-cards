import { Card, Rank } from './types';

type HandRank = {
  rank: number;
  description: string;
  tiebreakers: number[];
};

export function evaluateOmahaHand(holeCards: Card[], communityCards: Card[]): HandRank {
  // Omaha rule: exactly 2 from hole, 3 from community
  let bestHand: HandRank = { rank: 0, description: 'High Card', tiebreakers: [] };
  
  // Try all combinations of 2 hole cards and 3 community cards
  for (let h1 = 0; h1 < holeCards.length; h1++) {
    for (let h2 = h1 + 1; h2 < holeCards.length; h2++) {
      for (let c1 = 0; c1 < communityCards.length; c1++) {
        for (let c2 = c1 + 1; c2 < communityCards.length; c2++) {
          for (let c3 = c2 + 1; c3 < communityCards.length; c3++) {
            const hand = [
              holeCards[h1],
              holeCards[h2],
              communityCards[c1],
              communityCards[c2],
              communityCards[c3],
            ];
            const handRank = evaluateFiveCardHand(hand);
            if (handRank.rank > bestHand.rank || 
                (handRank.rank === bestHand.rank && compareHands(handRank, bestHand) > 0)) {
              bestHand = handRank;
            }
          }
        }
      }
    }
  }
  
  return bestHand;
}

function evaluateFiveCardHand(cards: Card[]): HandRank {
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);
  const ranks = sorted.map(c => c.rank);
  const suits = sorted.map(c => c.suit);
  
  const rankCounts = new Map<Rank, number>();
  ranks.forEach(r => rankCounts.set(r, (rankCounts.get(r) || 0) + 1));
  
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  
  // Straight Flush
  if (isFlush && isStraight) {
    return { rank: 8, description: 'Straight Flush', tiebreakers: [ranks[0]] };
  }
  
  // Four of a Kind
  const fourKind = Array.from(rankCounts.entries()).find(([_, count]) => count === 4);
  if (fourKind) {
    return { rank: 7, description: 'Four of a Kind', tiebreakers: [fourKind[0]] };
  }
  
  // Full House
  const threeKind = Array.from(rankCounts.entries()).find(([_, count]) => count === 3);
  const pair = Array.from(rankCounts.entries()).find(([_, count]) => count === 2);
  if (threeKind && pair) {
    return { rank: 6, description: 'Full House', tiebreakers: [threeKind[0], pair[0]] };
  }
  
  // Flush
  if (isFlush) {
    return { rank: 5, description: 'Flush', tiebreakers: ranks };
  }
  
  // Straight
  if (isStraight) {
    return { rank: 4, description: 'Straight', tiebreakers: [ranks[0]] };
  }
  
  // Three of a Kind
  if (threeKind) {
    return { rank: 3, description: 'Three of a Kind', tiebreakers: [threeKind[0]] };
  }
  
  // Two Pair
  const pairs = Array.from(rankCounts.entries()).filter(([_, count]) => count === 2);
  if (pairs.length === 2) {
    const pairRanks = pairs.map(([r]) => r).sort((a, b) => b - a);
    return { rank: 2, description: 'Two Pair', tiebreakers: pairRanks };
  }
  
  // One Pair
  if (pair) {
    return { rank: 1, description: 'One Pair', tiebreakers: [pair[0]] };
  }
  
  // High Card
  return { rank: 0, description: 'High Card', tiebreakers: ranks };
}

function checkStraight(ranks: Rank[]): boolean {
  const unique = Array.from(new Set(ranks)).sort((a, b) => b - a);
  if (unique.length < 5) return false;
  
  for (let i = 0; i < unique.length - 4; i++) {
    if (unique[i] - unique[i + 4] === 4) return true;
  }
  
  // Check for A-2-3-4-5 (wheel)
  if (unique.includes(14) && unique.includes(2) && unique.includes(3) && 
      unique.includes(4) && unique.includes(5)) {
    return true;
  }
  
  return false;
}

function compareHands(a: HandRank, b: HandRank): number {
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const aVal = a.tiebreakers[i] || 0;
    const bVal = b.tiebreakers[i] || 0;
    if (aVal !== bVal) return aVal - bVal;
  }
  return 0;
}

export function determineWinner(players: Array<{ id: string; holeCards: Card[] }>, communityCards: Card[]): { winnerId: string; hand: string } {
  let bestPlayer = players[0];
  let bestHand = evaluateOmahaHand(bestPlayer.holeCards, communityCards);
  
  for (let i = 1; i < players.length; i++) {
    const hand = evaluateOmahaHand(players[i].holeCards, communityCards);
    if (hand.rank > bestHand.rank || 
        (hand.rank === bestHand.rank && compareHands(hand, bestHand) > 0)) {
      bestPlayer = players[i];
      bestHand = hand;
    }
  }
  
  return { winnerId: bestPlayer.id, hand: bestHand.description };
}
