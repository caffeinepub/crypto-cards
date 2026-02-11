import { Card, OmahaGameState, Player, Street, Suit, Rank } from './types';
import { determineWinner } from './handEvaluator';

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

export function initializeGame(playerName: string, seed: number = Date.now()): OmahaGameState {
  const deck = shuffleDeck(createDeck(), seed);
  
  const players: Player[] = [
    { id: 'player', name: playerName, holeCards: [], chips: 1000, currentBet: 0, folded: false, isBot: false },
    { id: 'bot1', name: 'Bot 1', holeCards: [], chips: 1000, currentBet: 0, folded: false, isBot: true },
    { id: 'bot2', name: 'Bot 2', holeCards: [], chips: 1000, currentBet: 0, folded: false, isBot: true },
    { id: 'bot3', name: 'Bot 3', holeCards: [], chips: 1000, currentBet: 0, folded: false, isBot: true },
  ];
  
  let cardIndex = 0;
  
  // Deal 4 hole cards to each player
  for (let i = 0; i < 4; i++) {
    for (const player of players) {
      player.holeCards.push(deck[cardIndex++]);
    }
  }
  
  return {
    players,
    currentPlayerIndex: 1, // Start after dealer
    dealerIndex: 0,
    street: 'preflop',
    communityCards: deck.slice(cardIndex, cardIndex + 5), // Pre-deal community cards
    pot: 0,
    currentBet: 0,
    gameOver: false,
    winner: null,
    winningHand: null,
  };
}

export function canCheck(state: OmahaGameState, playerId: string): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.folded) return false;
  return player.currentBet === state.currentBet;
}

export function canCall(state: OmahaGameState, playerId: string): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.folded) return false;
  return player.currentBet < state.currentBet && state.currentBet > 0;
}

export function performAction(
  state: OmahaGameState,
  playerId: string,
  action: 'fold' | 'check' | 'call' | 'bet',
  amount?: number
): OmahaGameState {
  let newState = JSON.parse(JSON.stringify(state)) as OmahaGameState;
  const player = newState.players.find(p => p.id === playerId);
  
  if (!player) throw new Error('Player not found');
  if (player.folded) throw new Error('Player already folded');
  
  switch (action) {
    case 'fold':
      player.folded = true;
      break;
      
    case 'check':
      if (!canCheck(state, playerId)) {
        throw new Error('Cannot check - must call or fold');
      }
      break;
      
    case 'call':
      if (!canCall(state, playerId)) {
        throw new Error('Cannot call');
      }
      const callAmount = newState.currentBet - player.currentBet;
      player.chips -= callAmount;
      player.currentBet = newState.currentBet;
      newState.pot += callAmount;
      break;
      
    case 'bet':
      if (!amount || amount <= 0) throw new Error('Invalid bet amount');
      const betAmount = amount;
      player.chips -= betAmount;
      player.currentBet += betAmount;
      newState.currentBet = Math.max(newState.currentBet, player.currentBet);
      newState.pot += betAmount;
      break;
  }
  
  // Move to next player
  newState.currentPlayerIndex = getNextActivePlayer(newState, newState.currentPlayerIndex);
  
  // Check if betting round is complete
  if (isBettingRoundComplete(newState)) {
    newState = advanceStreet(newState);
  }
  
  return newState;
}

function getNextActivePlayer(state: OmahaGameState, currentIndex: number): number {
  let nextIndex = (currentIndex + 1) % state.players.length;
  while (state.players[nextIndex].folded && nextIndex !== currentIndex) {
    nextIndex = (nextIndex + 1) % state.players.length;
  }
  return nextIndex;
}

function isBettingRoundComplete(state: OmahaGameState): boolean {
  const activePlayers = state.players.filter(p => !p.folded);
  if (activePlayers.length === 1) return true;
  
  const allBetsEqual = activePlayers.every(p => p.currentBet === state.currentBet);
  return allBetsEqual;
}

function advanceStreet(state: OmahaGameState): OmahaGameState {
  const newState = { ...state };
  
  // Reset bets
  newState.players.forEach(p => { p.currentBet = 0; });
  newState.currentBet = 0;
  
  // Check for single winner
  const activePlayers = newState.players.filter(p => !p.folded);
  if (activePlayers.length === 1) {
    newState.gameOver = true;
    newState.winner = activePlayers[0].id;
    newState.winningHand = 'All others folded';
    activePlayers[0].chips += newState.pot;
    return newState;
  }
  
  // Advance street
  switch (newState.street) {
    case 'preflop':
      newState.street = 'flop';
      break;
    case 'flop':
      newState.street = 'turn';
      break;
    case 'turn':
      newState.street = 'river';
      break;
    case 'river':
      newState.street = 'showdown';
      const result = determineWinner(
        activePlayers.map(p => ({ id: p.id, holeCards: p.holeCards })),
        newState.communityCards
      );
      newState.gameOver = true;
      newState.winner = result.winnerId;
      newState.winningHand = result.hand;
      const winner = newState.players.find(p => p.id === result.winnerId)!;
      winner.chips += newState.pot;
      break;
  }
  
  // Reset to first active player after dealer
  newState.currentPlayerIndex = getNextActivePlayer(newState, newState.dealerIndex);
  
  return newState;
}

export function getCommunityCardsForStreet(state: OmahaGameState): Card[] {
  switch (state.street) {
    case 'preflop':
      return [];
    case 'flop':
      return state.communityCards.slice(0, 3);
    case 'turn':
      return state.communityCards.slice(0, 4);
    case 'river':
    case 'showdown':
      return state.communityCards;
    default:
      return [];
  }
}
