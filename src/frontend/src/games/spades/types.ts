export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  tricksWon: number;
  isBot: boolean;
}

export interface Trick {
  leadSuit: Suit | null;
  cards: Array<{ playerId: string; card: Card }>;
  winner: string | null;
}

export interface SpadesGameState {
  players: Player[];
  currentPlayerIndex: number;
  currentTrick: Trick;
  completedTricks: Trick[];
  spadesBroken: boolean;
  gameOver: boolean;
  winner: string | null;
}

export function cardToString(card: Card): string {
  const rankMap: Record<Rank, string> = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    11: 'J', 12: 'Q', 13: 'K', 14: 'A'
  };
  const suitSymbol: Record<Suit, string> = {
    spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣'
  };
  return `${rankMap[card.rank]}${suitSymbol[card.suit]}`;
}

export function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣'
  };
  return symbols[suit];
}

export function getSuitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}
