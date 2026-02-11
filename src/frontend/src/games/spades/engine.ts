import { Card, Player, SpadesGameState, Suit, Rank, Trick } from './types';

export function createDeck(): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  
  return deck;
}

export function shuffleDeck(deck: Card[], seed: number): Card[] {
  const shuffled = [...deck];
  let random = seed;
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    random = (random * 9301 + 49297) % 233280;
    const j = Math.floor((random / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

export function initializeGame(playerName: string, seed: number = Date.now()): SpadesGameState {
  const deck = shuffleDeck(createDeck(), seed);
  
  const players: Player[] = [
    { id: 'player', name: playerName, hand: [], tricksWon: 0, isBot: false },
    { id: 'bot1', name: 'Bot 1', hand: [], tricksWon: 0, isBot: true },
    { id: 'bot2', name: 'Bot 2', hand: [], tricksWon: 0, isBot: true },
    { id: 'bot3', name: 'Bot 3', hand: [], tricksWon: 0, isBot: true },
  ];
  
  // Deal 13 cards to each player
  for (let i = 0; i < 13; i++) {
    for (let p = 0; p < 4; p++) {
      players[p].hand.push(deck[i * 4 + p]);
    }
  }
  
  // Sort hands
  players.forEach(player => {
    player.hand.sort((a, b) => {
      if (a.suit !== b.suit) {
        const suitOrder: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
        return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
      }
      return b.rank - a.rank;
    });
  });
  
  return {
    players,
    currentPlayerIndex: 0,
    currentTrick: { leadSuit: null, cards: [], winner: null },
    completedTricks: [],
    spadesBroken: false,
    gameOver: false,
    winner: null,
  };
}

export function canPlayCard(state: SpadesGameState, playerId: string, card: Card): { valid: boolean; error?: string } {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { valid: false, error: 'Player not found' };
  
  if (!player.hand.some(c => c.suit === card.suit && c.rank === card.rank)) {
    return { valid: false, error: 'Card not in hand' };
  }
  
  const trick = state.currentTrick;
  
  // First card of trick
  if (trick.cards.length === 0) {
    // Can't lead spades unless broken or only spades left
    if (card.suit === 'spades' && !state.spadesBroken) {
      const hasNonSpades = player.hand.some(c => c.suit !== 'spades');
      if (hasNonSpades) {
        return { valid: false, error: 'Spades not broken yet' };
      }
    }
    return { valid: true };
  }
  
  // Must follow suit if possible
  if (trick.leadSuit) {
    const hasSuit = player.hand.some(c => c.suit === trick.leadSuit);
    if (hasSuit && card.suit !== trick.leadSuit) {
      return { valid: false, error: `Must follow ${trick.leadSuit}` };
    }
  }
  
  return { valid: true };
}

export function playCard(state: SpadesGameState, playerId: string, card: Card): SpadesGameState {
  const validation = canPlayCard(state, playerId, card);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid move');
  }
  
  const newState = JSON.parse(JSON.stringify(state)) as SpadesGameState;
  const player = newState.players.find(p => p.id === playerId)!;
  
  // Remove card from hand
  player.hand = player.hand.filter(c => !(c.suit === card.suit && c.rank === card.rank));
  
  // Add to trick
  if (newState.currentTrick.cards.length === 0) {
    newState.currentTrick.leadSuit = card.suit;
  }
  newState.currentTrick.cards.push({ playerId, card });
  
  // Break spades if played
  if (card.suit === 'spades') {
    newState.spadesBroken = true;
  }
  
  // Check if trick is complete
  if (newState.currentTrick.cards.length === 4) {
    const winner = determineTrickWinner(newState.currentTrick);
    newState.currentTrick.winner = winner;
    
    const winnerPlayer = newState.players.find(p => p.id === winner)!;
    winnerPlayer.tricksWon++;
    
    newState.completedTricks.push({ ...newState.currentTrick });
    newState.currentTrick = { leadSuit: null, cards: [], winner: null };
    
    // Winner leads next trick
    newState.currentPlayerIndex = newState.players.findIndex(p => p.id === winner);
    
    // Check if game over
    if (newState.completedTricks.length === 13) {
      newState.gameOver = true;
      const maxTricks = Math.max(...newState.players.map(p => p.tricksWon));
      newState.winner = newState.players.find(p => p.tricksWon === maxTricks)!.id;
    }
  } else {
    // Next player
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % 4;
  }
  
  return newState;
}

function determineTrickWinner(trick: Trick): string {
  const leadSuit = trick.leadSuit!;
  let winningCard = trick.cards[0];
  
  for (let i = 1; i < trick.cards.length; i++) {
    const current = trick.cards[i];
    
    // Spades always win
    if (current.card.suit === 'spades' && winningCard.card.suit !== 'spades') {
      winningCard = current;
    } else if (current.card.suit === 'spades' && winningCard.card.suit === 'spades') {
      if (current.card.rank > winningCard.card.rank) {
        winningCard = current;
      }
    } else if (current.card.suit === leadSuit && winningCard.card.suit === leadSuit) {
      if (current.card.rank > winningCard.card.rank) {
        winningCard = current;
      }
    } else if (current.card.suit === leadSuit && winningCard.card.suit !== 'spades') {
      winningCard = current;
    }
  }
  
  return winningCard.playerId;
}
