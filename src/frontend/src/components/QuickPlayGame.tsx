import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { GameMode } from '../App';
import { useQuickPlaySession } from '../hooks/useQuickPlaySession';
import { SpadesGameState } from '../games/spades/types';
import { OmahaGameState } from '../games/omaha/types';
import { cardToString as spadesCardToString, getSuitColor as spadesSuitColor } from '../games/spades/types';
import { cardToString as omahaCardToString, getSuitColor as omahaSuitColor } from '../games/omaha/types';
import { canCheck, canCall } from '../games/omaha/engine';
import OmahaCommunityBoard from '../games/omaha/OmahaCommunityBoard';
import SpadesScoreboard from './spades/SpadesScoreboard';

interface QuickPlayGameProps {
  gameType: 'spades' | 'omaha4Card';
  gameMode: GameMode;
  onExit: () => void;
  playerName: string;
}

export default function QuickPlayGame({ gameType, gameMode, onExit, playerName }: QuickPlayGameProps) {
  const { session, isProcessing, startGame, submitBid, playCard, performOmahaAction, startOmahaNextHand, resetGame } = useQuickPlaySession();

  useEffect(() => {
    startGame(gameType, playerName);
    return () => resetGame();
  }, [gameType, playerName, startGame, resetGame]);

  const handleExit = () => {
    resetGame();
    onExit();
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    );
  }

  if (gameType === 'spades') {
    return <SpadesGame state={session.state as SpadesGameState} onSubmitBid={submitBid} onPlayCard={playCard} onExit={handleExit} isProcessing={isProcessing} />;
  } else {
    return <OmahaGame state={session.state as OmahaGameState} onAction={performOmahaAction} onNextHand={startOmahaNextHand} onExit={handleExit} isProcessing={isProcessing} />;
  }
}

function SpadesGame({ state, onSubmitBid, onPlayCard, onExit, isProcessing }: { 
  state: SpadesGameState; 
  onSubmitBid: (bid: number) => void;
  onPlayCard: (card: any) => void; 
  onExit: () => void;
  isProcessing: boolean;
}) {
  const player = state.players.find(p => p.id === 'player')!;
  const isPlayerTurn = state.players[state.currentPlayerIndex].id === 'player';
  const trickRef = useRef<HTMLDivElement>(null);
  const [selectedBid, setSelectedBid] = useState<number>(3);

  // Scroll trick into view when it changes (helpful on mobile)
  useEffect(() => {
    if (trickRef.current && (state.currentTrick.cards.length > 0 || state.completedTricks.length > 0)) {
      trickRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [state.currentTrick.cards.length, state.completedTricks.length]);

  // Determine what to show: current trick, last trick, or empty state
  const hasCurrentTrick = state.currentTrick.cards.length > 0;
  const hasCompletedTricks = state.completedTricks.length > 0;
  const lastTrick = hasCompletedTricks ? state.completedTricks[state.completedTricks.length - 1] : null;

  // Show bidding UI if in bidding phase
  if (state.biddingPhase && !state.biddingComplete) {
    const hasBid = player.bid !== null;

    return (
      <div className="space-y-4 p-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onExit}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Game
          </Button>
          <h2 className="text-xl font-bold gradient-text">Spades - Bidding Phase</h2>
        </div>

        {/* Sticky scoreboard on mobile, regular on desktop */}
        <div className="md:hidden">
          <SpadesScoreboard state={state} compact sticky />
        </div>
        <div className="hidden md:block">
          <SpadesScoreboard state={state} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hand {state.handNumber} - Place Your Bid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Look at your cards and decide how many tricks you think you can win.
            </div>

            {/* Player's hand */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Your Cards:</h3>
              <div className="flex flex-wrap gap-2">
                {player.hand.map((card, idx) => (
                  <div
                    key={idx}
                    className={`playing-card w-16 h-20 text-sm ${
                      spadesSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'
                    }`}
                  >
                    {spadesCardToString(card)}
                  </div>
                ))}
              </div>
            </div>

            {/* Bid selection */}
            {!hasBid && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">Select your bid (0-13):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="13"
                    value={selectedBid}
                    onChange={(e) => setSelectedBid(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-lg font-bold w-8 text-center">{selectedBid}</span>
                </div>
                <Button
                  onClick={() => onSubmitBid(selectedBid)}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Submitting...' : 'Submit Bid'}
                </Button>
              </div>
            )}

            {hasBid && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">You bid: <span className="font-bold text-foreground">{player.bid}</span></p>
                <p className="text-xs text-muted-foreground mt-1">Waiting for other players...</p>
              </div>
            )}

            {/* Show all bids */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Bids:</h3>
              <div className="grid grid-cols-2 gap-2">
                {state.players.map(p => (
                  <div key={p.id} className="text-sm p-2 bg-muted rounded">
                    <span className="font-semibold">{p.name}:</span>{' '}
                    {p.bid !== null ? p.bid : '...'}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Exit Game
        </Button>
        <h2 className="text-xl font-bold gradient-text">Spades - Hand {state.handNumber}</h2>
      </div>

      {/* Sticky scoreboard on mobile, regular on desktop */}
      <div className="md:hidden">
        <SpadesScoreboard state={state} compact sticky />
      </div>
      <div className="hidden md:block">
        <SpadesScoreboard state={state} />
      </div>

      {/* Game Over */}
      {state.gameOver && state.winner && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="h-6 w-6" />
              Game Over!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              <span className="font-bold">{state.players.find(p => p.id === state.winner)?.name}</span> wins with {state.players.find(p => p.id === state.winner)?.totalScore} points!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Trick */}
      <Card ref={trickRef}>
        <CardHeader>
          <CardTitle>
            {hasCurrentTrick ? `Current Trick (${state.currentTrick.cards.length}/4)` : 
             lastTrick ? 'Last Trick' : 'Waiting for first card...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {(hasCurrentTrick ? state.currentTrick.cards : (lastTrick?.cards || [])).map((playedCard, idx) => {
              const playerName = state.players.find(p => p.id === playedCard.playerId)?.name || 'Unknown';
              const isWinner = !hasCurrentTrick && lastTrick?.winner === playedCard.playerId;
              return (
                <div key={idx} className={`p-3 rounded-lg ${isWinner ? 'bg-primary/10 border-2 border-primary' : 'bg-muted'}`}>
                  <div className="text-xs text-muted-foreground mb-1">{playerName}</div>
                  <div className={`playing-card w-12 h-16 text-xs ${
                    spadesSuitColor(playedCard.card.suit) === 'red' ? 'card-red' : 'card-black'
                  }`}>
                    {spadesCardToString(playedCard.card)}
                  </div>
                  {isWinner && <div className="text-xs text-primary font-semibold mt-1">Winner</div>}
                </div>
              );
            })}
          </div>
          {!hasCurrentTrick && !lastTrick && (
            <p className="text-sm text-muted-foreground text-center py-4">No cards played yet</p>
          )}
        </CardContent>
      </Card>

      {/* Player Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Hand {isPlayerTurn && <span className="text-primary ml-2">(Your Turn)</span>}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bid: {player.bid}</span>
              <span>Tricks Won: {player.tricksWon}</span>
              <span>Hand Score: {player.handScore}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {player.hand.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => isPlayerTurn && !isProcessing && onPlayCard(card)}
                  disabled={!isPlayerTurn || isProcessing}
                  className={`playing-card w-16 h-20 text-sm transition-transform ${
                    spadesSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'
                  } ${isPlayerTurn && !isProcessing ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  {spadesCardToString(card)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Players */}
      <Card>
        <CardHeader>
          <CardTitle>Other Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {state.players.filter(p => p.id !== 'player').map(p => {
              const isCurrent = state.players[state.currentPlayerIndex].id === p.id;
              return (
                <div key={p.id} className={`p-3 rounded-lg ${isCurrent ? 'bg-primary/10 border-2 border-primary' : 'bg-muted'}`}>
                  <div className="font-semibold">{p.name} {isCurrent && '(Playing...)'}</div>
                  <div className="text-xs text-muted-foreground">
                    Bid: {p.bid} | Won: {p.tricksWon} | Cards: {p.hand.length}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OmahaGame({ state, onAction, onNextHand, onExit, isProcessing }: { 
  state: OmahaGameState; 
  onAction: (action: 'fold' | 'check' | 'call' | 'bet', amount?: number) => void; 
  onNextHand: () => void;
  onExit: () => void;
  isProcessing: boolean;
}) {
  const player = state.players.find(p => p.id === 'player')!;
  const isPlayerTurn = state.players[state.currentPlayerIndex].id === 'player';
  const [betAmount, setBetAmount] = useState<number>(0);

  const playerCanCheck = canCheck(state, 'player');
  const playerCanCall = canCall(state, 'player');

  // Calculate min and max bet amounts
  const minBet = state.currentBet > 0 ? state.currentBet + 10 : 10;
  const maxBet = player.chips + player.currentBet; // Total chips available including what's already bet
  
  // Betting is only valid if max >= min
  const canBet = maxBet >= minBet;

  useEffect(() => {
    if (canBet) {
      setBetAmount(Math.min(minBet, maxBet));
    }
  }, [minBet, maxBet, canBet]);

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto omaha-game-wrapper">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Exit Game
        </Button>
        <h2 className="text-xl font-bold gradient-text">Pot Limit Omaha</h2>
      </div>

      {/* Game Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Street</div>
              <div className="font-bold capitalize">{state.street}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pot</div>
              <div className="font-bold text-primary">{state.pot}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Current Bet</div>
              <div className="font-bold">{state.currentBet}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Cards */}
      <OmahaCommunityBoard
        communityCards={state.communityCards}
        street={state.street}
      />

      {/* Game Over */}
      {state.gameOver && state.winner && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="h-6 w-6" />
              Hand Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg">
                <span className="font-bold">{state.players.find(p => p.id === state.winner)?.name}</span> wins!
              </p>
              {state.winningHand && (
                <p className="text-sm text-muted-foreground mt-1">{state.winningHand}</p>
              )}
            </div>
            <Button
              onClick={onNextHand}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Starting...' : 'Next Hand'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Player Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Hand {isPlayerTurn && !state.gameOver && <span className="text-primary ml-2">(Your Turn)</span>}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Chips: <span className="font-bold">{player.chips}</span></span>
              <span>Current Bet: <span className="font-bold">{player.currentBet}</span></span>
            </div>
            
            {/* Hole Cards */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">Your Hole Cards (use 2):</div>
              <div className="flex gap-2">
                {player.holeCards.map((card, idx) => (
                  <div
                    key={idx}
                    className={`playing-card w-16 h-20 text-sm ${
                      omahaSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'
                    }`}
                  >
                    {omahaCardToString(card)}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {isPlayerTurn && !state.gameOver && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="destructive"
                    onClick={() => onAction('fold')}
                    disabled={isProcessing}
                    size="sm"
                  >
                    Fold
                  </Button>
                  
                  {playerCanCheck && (
                    <Button
                      variant="secondary"
                      onClick={() => onAction('check')}
                      disabled={isProcessing}
                      size="sm"
                    >
                      Check
                    </Button>
                  )}
                  
                  {playerCanCall && (
                    <Button
                      variant="default"
                      onClick={() => onAction('call')}
                      disabled={isProcessing}
                      size="sm"
                    >
                      Call {state.currentBet - player.currentBet}
                    </Button>
                  )}
                </div>

                {/* Bet/Raise controls */}
                {canBet && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={minBet}
                        max={maxBet}
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="flex-1"
                        disabled={isProcessing}
                      />
                      <span className="text-sm font-bold w-16 text-right">{betAmount}</span>
                    </div>
                    <Button
                      variant="default"
                      onClick={() => onAction('bet', betAmount)}
                      disabled={isProcessing}
                      className="w-full"
                      size="sm"
                    >
                      {state.currentBet > 0 ? `Raise to ${betAmount}` : `Bet ${betAmount}`}
                    </Button>
                  </div>
                )}

                {!canBet && !playerCanCheck && !playerCanCall && (
                  <p className="text-xs text-muted-foreground text-center">Not enough chips to bet or raise</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Other Players */}
      <Card>
        <CardHeader>
          <CardTitle>Other Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {state.players.filter(p => p.id !== 'player').map(p => {
              const isCurrent = state.players[state.currentPlayerIndex].id === p.id;
              const isFolded = p.folded;
              return (
                <div key={p.id} className={`p-3 rounded-lg ${isCurrent && !state.gameOver ? 'bg-primary/10 border-2 border-primary' : 'bg-muted'} ${isFolded ? 'opacity-50' : ''}`}>
                  <div className="font-semibold">
                    {p.name} {isCurrent && !state.gameOver && '(Playing...)'}
                    {isFolded && ' (Folded)'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Chips: {p.chips} | Bet: {p.currentBet}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
