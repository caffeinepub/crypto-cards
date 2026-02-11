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
    { id: 'player', name: playerName, holeCards: [], chips: 1000, currentBet: 0, folded: false, isBot: false, hasActedThisStreet: false },
    { id: 'bot1', name: 'Bot 1', holeCards: [], chips: 1000, currentBet: 0, folded: false, isBot: true, hasActedThisStreet: false },
    { id: 'bot2', name: 'Bot 2', holeCards: [], chips: 1000, currentBet: 0, folded: false, isBot: true, hasActedThisStreet: false },
    { id: 'bot3', name: 'Bot 3', holeCards: [], chips: 1000, currentBet: 0, folded: false, isBot: true, hasActedThisStreet: false },
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
    lastRaiserIndex: undefined,
  };
}

export function startNextHand(state: OmahaGameState, seed: number = Date.now()): OmahaGameState {
  const deck = shuffleDeck(createDeck(), seed);
  
  // Preserve player info (id, name, isBot, chips) but reset hand-specific state
  const players: Player[] = state.players.map(p => ({
    id: p.id,
    name: p.name,
    isBot: p.isBot,
    chips: p.chips, // Preserve chip stacks
    holeCards: [],
    currentBet: 0,
    folded: false,
    hasActedThisStreet: false,
  }));
  
  let cardIndex = 0;
  
  // Deal 4 hole cards to each player
  for (let i = 0; i < 4; i++) {
    for (const player of players) {
      player.holeCards.push(deck[cardIndex++]);
    }
  }
  
  // Rotate dealer
  const newDealerIndex = (state.dealerIndex + 1) % players.length;
  
  return {
    players,
    currentPlayerIndex: (newDealerIndex + 1) % players.length, // Start after dealer
    dealerIndex: newDealerIndex,
    street: 'preflop',
    communityCards: deck.slice(cardIndex, cardIndex + 5), // Pre-deal community cards
    pot: 0,
    currentBet: 0,
    gameOver: false,
    winner: null,
    winningHand: null,
    lastRaiserIndex: undefined,
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
  const playerIndex = newState.players.findIndex(p => p.id === playerId);
  const player = newState.players[playerIndex];
  
  if (!player) throw new Error('Player not found');
  if (player.folded) throw new Error('Player already folded');
  
  switch (action) {
    case 'fold':
      player.folded = true;
      player.hasActedThisStreet = true;
      break;
      
    case 'check':
      if (!canCheck(state, playerId)) {
        throw new Error('Cannot check - must call or fold');
      }
      player.hasActedThisStreet = true;
      break;
      
    case 'call':
      if (!canCall(state, playerId)) {
        throw new Error('Cannot call');
      }
      const callAmount = newState.currentBet - player.currentBet;
      if (callAmount > player.chips) {
        throw new Error('Not enough chips to call');
      }
      player.chips -= callAmount;
      player.currentBet = newState.currentBet;
      newState.pot += callAmount;
      player.hasActedThisStreet = true;
      break;
      
    case 'bet':
      if (!amount || amount <= 0) throw new Error('Invalid bet amount');
      
      // Treat amount as "raise to" total for this street
      const raiseToAmount = amount;
      const contributed = raiseToAmount - player.currentBet;
      
      if (contributed <= 0) throw new Error('Bet must be higher than current bet');
      if (contributed > player.chips) throw new Error('Not enough chips');
      
      player.chips -= contributed;
      player.currentBet = raiseToAmount;
      newState.pot += contributed;
      newState.currentBet = Math.max(newState.currentBet, raiseToAmount);
      player.hasActedThisStreet = true;
      
      // Mark this player as the last raiser
      newState.lastRaiserIndex = playerIndex;
      
      // Reset hasActedThisStreet for all other active players (they need to respond to the raise)
      newState.players.forEach((p, idx) => {
        if (idx !== playerIndex && !p.folded) {
          p.hasActedThisStreet = false;
        }
      });
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
  
  // Only one player left
  if (activePlayers.length === 1) return true;
  
  // All active players must have acted this street
  const allHaveActed = activePlayers.every(p => p.hasActedThisStreet);
  if (!allHaveActed) return false;
  
  // All active players must have matching bets
  const allBetsEqual = activePlayers.every(p => p.currentBet === state.currentBet);
  
  return allBetsEqual;
}

function advanceStreet(state: OmahaGameState): OmahaGameState {
  const newState = { ...state };
  
  // Reset bets and action tracking for new street
  newState.players.forEach(p => { 
    p.currentBet = 0;
    p.hasActedThisStreet = false;
  });
  newState.currentBet = 0;
  newState.lastRaiserIndex = undefined;
  
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
