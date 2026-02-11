export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type Action = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface Player {
  id: string;
  name: string;
  holeCards: Card[];
  chips: number;
  currentBet: number;
  folded: boolean;
  isBot: boolean;
  hasActedThisStreet?: boolean;
}

export interface OmahaGameState {
  players: Player[];
  currentPlayerIndex: number;
  dealerIndex: number;
  street: Street;
  communityCards: Card[];
  pot: number;
  currentBet: number;
  gameOver: boolean;
  winner: string | null;
  winningHand: string | null;
  lastRaiserIndex?: number;
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

export function getSuitColor(suit: Suit): 'red' | 'black' {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}
