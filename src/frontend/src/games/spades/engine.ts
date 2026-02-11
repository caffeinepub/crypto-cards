import { Card, Player, SpadesGameState, Suit, Rank, Trick, RenegePenalty } from './types';
import { calculateHandScore, hasReachedTarget, determineWinner, TARGET_SCORE } from './scoring';

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
    { id: 'player', name: playerName, hand: [], tricksWon: 0, isBot: false, bid: null, totalScore: 0, handScore: 0, lastHandScore: 0 },
    { id: 'bot1', name: 'Bot 1', hand: [], tricksWon: 0, isBot: true, bid: null, totalScore: 0, handScore: 0, lastHandScore: 0 },
    { id: 'bot2', name: 'Bot 2', hand: [], tricksWon: 0, isBot: true, bid: null, totalScore: 0, handScore: 0, lastHandScore: 0 },
    { id: 'bot3', name: 'Bot 3', hand: [], tricksWon: 0, isBot: true, bid: null, totalScore: 0, handScore: 0, lastHandScore: 0 },
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
    renegePenalties: [],
    biddingPhase: true,
    biddingComplete: false,
    handNumber: 1,
  };
}

function startNewHand(state: SpadesGameState, seed: number = Date.now()): SpadesGameState {
  const deck = shuffleDeck(createDeck(), seed);
  
  // Preserve total scores, reset hand-specific data
  const players: Player[] = state.players.map(p => ({
    ...p,
    hand: [],
    tricksWon: 0,
    bid: null,
    lastHandScore: p.handScore,
    handScore: 0,
  }));
  
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
    renegePenalties: [],
    biddingPhase: true,
    biddingComplete: false,
    handNumber: state.handNumber + 1,
  };
}

export function submitBid(state: SpadesGameState, playerId: string, bid: number): SpadesGameState {
  if (!state.biddingPhase) {
    throw new Error('Bidding phase is over');
  }
  
  if (bid < 0 || bid > 13) {
    throw new Error('Bid must be between 0 and 13');
  }
  
  const newState = JSON.parse(JSON.stringify(state)) as SpadesGameState;
  const player = newState.players.find(p => p.id === playerId);
  
  if (!player) {
    throw new Error('Player not found');
  }
  
  if (player.bid !== null) {
    throw new Error('Player has already bid');
  }
  
  player.bid = bid;
  
  // Check if all players have bid
  const allBid = newState.players.every(p => p.bid !== null);
  if (allBid) {
    newState.biddingPhase = false;
    newState.biddingComplete = true;
  } else {
    // Move to next player
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % 4;
  }
  
  return newState;
}

export function canPlayCard(state: SpadesGameState, playerId: string, card: Card): { valid: boolean; error?: string } {
  if (state.biddingPhase) {
    return { valid: false, error: 'Complete bidding first' };
  }
  
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
  
  // Check for reneging (not following suit when able)
  const trick = newState.currentTrick;
  if (trick.leadSuit && trick.cards.length > 0) {
    const hasSuit = player.hand.some(c => c.suit === trick.leadSuit);
    if (hasSuit && card.suit !== trick.leadSuit) {
      // Record reneging penalty
      const penalty: RenegePenalty = {
        playerId: playerId,
        playerName: player.name,
        trickNumber: newState.completedTricks.length + 1,
        message: `Reneged: did not follow suit`
      };
      newState.renegePenalties.push(penalty);
    }
  }
  
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
    
    // Check if hand is complete (13 tricks)
    if (newState.completedTricks.length === 13) {
      // Calculate hand scores and update totals
      newState.players.forEach(p => {
        p.handScore = calculateHandScore(p);
        p.totalScore += p.handScore;
      });
      
      // Check if anyone reached 500+
      if (hasReachedTarget(newState.players)) {
        // Game over - determine winner
        newState.gameOver = true;
        const winner = determineWinner(newState.players);
        newState.winner = winner.id;
      } else {
        // Start new hand automatically
        const seed = Date.now() + newState.handNumber;
        return startNewHand(newState, seed);
      }
    }
  } else {
    // Next player
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % 4;
  }
  
  return newState;
}

function determineTrickWinner(trick: Trick): string {
  const leadSuit = trick.leadSuit!;
  
  // Check if any spades were played
  const spadesPlayed = trick.cards.filter(c => c.card.suit === 'spades');
  
  if (spadesPlayed.length > 0) {
    // Spades are trump - highest spade wins
    let winningCard = spadesPlayed[0];
    for (let i = 1; i < spadesPlayed.length; i++) {
      if (spadesPlayed[i].card.rank > winningCard.card.rank) {
        winningCard = spadesPlayed[i];
      }
    }
    return winningCard.playerId;
  } else {
    // No spades - highest card of lead suit wins
    const leadSuitCards = trick.cards.filter(c => c.card.suit === leadSuit);
    let winningCard = leadSuitCards[0];
    for (let i = 1; i < leadSuitCards.length; i++) {
      if (leadSuitCards[i].card.rank > winningCard.card.rank) {
        winningCard = leadSuitCards[i];
      }
    }
    return winningCard.playerId;
  }
}
