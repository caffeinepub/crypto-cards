import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, AlertTriangle, Target } from 'lucide-react';
import { GameMode } from '../App';
import { useQuickPlaySession } from '../hooks/useQuickPlaySession';
import { SpadesGameState } from '../games/spades/types';
import { OmahaGameState } from '../games/omaha/types';
import { cardToString as spadesCardToString, getSuitColor as spadesSuitColor } from '../games/spades/types';
import { cardToString as omahaCardToString, getSuitColor as omahaSuitColor } from '../games/omaha/types';
import { getCommunityCardsForStreet, canCheck, canCall } from '../games/omaha/engine';
import { TARGET_SCORE } from '../games/spades/scoring';

interface QuickPlayGameProps {
  gameType: 'spades' | 'omaha4Card';
  gameMode: GameMode;
  onExit: () => void;
  playerName: string;
}

export default function QuickPlayGame({ gameType, gameMode, onExit, playerName }: QuickPlayGameProps) {
  const { session, isProcessing, startGame, submitBid, playCard, performOmahaAction, resetGame } = useQuickPlaySession();

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
    return <OmahaGame state={session.state as OmahaGameState} onAction={performOmahaAction} onExit={handleExit} isProcessing={isProcessing} />;
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

  // Count reneging penalties per player
  const getPenaltyCount = (playerId: string) => {
    return state.renegePenalties.filter(p => p.playerId === playerId).length;
  };

  // Determine what to show: current trick, last trick, or empty state
  const hasCurrentTrick = state.currentTrick.cards.length > 0;
  const hasCompletedTricks = state.completedTricks.length > 0;
  const lastTrick = hasCompletedTricks ? state.completedTricks[state.completedTricks.length - 1] : null;

  // Show bidding UI if in bidding phase
  if (state.biddingPhase) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold gradient-text">Spades - Bidding</h2>
            <p className="text-muted-foreground mt-1">
              Hand {state.handNumber} | Place your bid (0-13 tricks)
            </p>
          </div>
          <Button onClick={onExit} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Exit Game
          </Button>
        </div>

        {/* Score Target Display */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Target Score</p>
                <p className="text-2xl font-bold text-primary">{TARGET_SCORE}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scoreboard */}
        <Card>
          <CardHeader>
            <CardTitle>Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {state.players.map(p => (
                <div key={p.id} className={`p-3 rounded-lg ${p.id === 'player' ? 'bg-primary/20 border border-primary' : 'bg-muted'}`}>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-2xl font-bold">{p.totalScore}</p>
                  {p.lastHandScore !== 0 && (
                    <p className="text-xs text-muted-foreground">
                      Last: {p.lastHandScore > 0 ? '+' : ''}{p.lastHandScore}
                    </p>
                  )}
                  {getPenaltyCount(p.id) > 0 && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3" />
                      {getPenaltyCount(p.id)} renege{getPenaltyCount(p.id) > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bidding Status */}
        <Card>
          <CardHeader>
            <CardTitle>Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {state.players.map(p => (
                <div key={p.id} className={`p-3 rounded-lg ${p.id === state.players[state.currentPlayerIndex].id ? 'bg-primary/20 border border-primary' : 'bg-muted'}`}>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.bid !== null ? `Bid: ${p.bid}` : 'Waiting...'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Player's Bidding Controls */}
        {isPlayerTurn && !isProcessing && (
          <Card>
            <CardHeader>
              <CardTitle>Your Bid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 justify-center">
                  <Button 
                    onClick={() => setSelectedBid(Math.max(0, selectedBid - 1))}
                    variant="outline"
                    disabled={selectedBid === 0}
                  >
                    -
                  </Button>
                  <div className="text-4xl font-bold w-20 text-center">{selectedBid}</div>
                  <Button 
                    onClick={() => setSelectedBid(Math.min(13, selectedBid + 1))}
                    variant="outline"
                    disabled={selectedBid === 13}
                  >
                    +
                  </Button>
                </div>
                <Button 
                  onClick={() => onSubmitBid(selectedBid)}
                  className="w-full"
                  size="lg"
                >
                  Submit Bid
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show player's hand during bidding */}
        <Card>
          <CardHeader>
            <CardTitle>Your Hand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 justify-center">
              {player.hand.map((card, idx) => (
                <div
                  key={idx}
                  className={`playing-card ${spadesSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'} w-16 h-24 text-xl`}
                >
                  {spadesCardToString(card)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {isProcessing && (
          <div className="text-center text-muted-foreground">
            <p>Processing bids...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Spades</h2>
          <p className="text-muted-foreground mt-1">
            Hand {state.handNumber} | Tricks: {player.tricksWon} / {player.bid} | Spades broken: {state.spadesBroken ? 'Yes' : 'No'}
          </p>
        </div>
        <Button onClick={onExit} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Exit Game
        </Button>
      </div>

      {state.gameOver && (
        <Card className="bg-primary/10 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-xl font-bold">Game Over!</h3>
                <p className="text-muted-foreground">
                  {state.winner === 'player' ? 'You won!' : `${state.players.find(p => p.id === state.winner)?.name} won!`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Final Score: {state.players.find(p => p.id === state.winner)?.totalScore} points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Target Display */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-center gap-3">
            <Target className="h-5 w-5 text-primary" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="text-lg font-bold text-primary">{TARGET_SCORE}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoreboard */}
      <Card>
        <CardHeader>
          <CardTitle>Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {state.players.map(p => (
              <div key={p.id} className={`p-3 rounded-lg ${p.id === 'player' ? 'bg-primary/20 border border-primary' : 'bg-muted'}`}>
                <p className="font-semibold">{p.name}</p>
                <p className="text-2xl font-bold">{p.totalScore}</p>
                <p className="text-xs text-muted-foreground">
                  Bid: {p.bid} | Won: {p.tricksWon}
                </p>
                {getPenaltyCount(p.id) > 0 && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {getPenaltyCount(p.id)} renege{getPenaltyCount(p.id) > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trick Display - Current or Last */}
      <Card ref={trickRef}>
        <CardHeader>
          <CardTitle>
            {hasCurrentTrick ? 'Current Trick' : hasCompletedTricks ? 'Last Trick' : 'Trick'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-3 md:gap-4 min-h-[140px] items-center flex-wrap p-2">
            {!hasCurrentTrick && !hasCompletedTricks ? (
              <p className="text-muted-foreground">No cards played yet</p>
            ) : hasCurrentTrick ? (
              // Show current trick in progress
              state.currentTrick.cards.map((played, idx) => (
                <div key={idx} className="text-center flex-shrink-0">
                  <div className={`playing-card ${spadesSuitColor(played.card.suit) === 'red' ? 'card-red' : 'card-black'} w-16 h-24 md:w-20 md:h-28 text-xl md:text-2xl`}>
                    {spadesCardToString(played.card)}
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">
                    {state.players.find(p => p.id === played.playerId)?.name}
                  </p>
                </div>
              ))
            ) : lastTrick ? (
              // Show last completed trick
              <>
                {lastTrick.cards.map((played, idx) => (
                  <div key={idx} className="text-center flex-shrink-0">
                    <div className={`playing-card ${spadesSuitColor(played.card.suit) === 'red' ? 'card-red' : 'card-black'} w-16 h-24 md:w-20 md:h-28 text-xl md:text-2xl opacity-60`}>
                      {spadesCardToString(played.card)}
                    </div>
                    <p className="text-xs mt-2 text-muted-foreground">
                      {state.players.find(p => p.id === played.playerId)?.name}
                      {played.playerId === lastTrick.winner && ' ✓'}
                    </p>
                  </div>
                ))}
              </>
            ) : null}
          </div>
          {hasCurrentTrick && state.currentTrick.leadSuit && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Lead suit: {state.currentTrick.leadSuit}
            </p>
          )}
          {!hasCurrentTrick && lastTrick && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Winner: {state.players.find(p => p.id === lastTrick.winner)?.name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Player's Hand */}
      <Card>
        <CardHeader>
          <CardTitle>Your Hand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-center">
            {player.hand.map((card, idx) => (
              <button
                key={idx}
                onClick={() => !state.gameOver && isPlayerTurn && !isProcessing && onPlayCard(card)}
                disabled={state.gameOver || !isPlayerTurn || isProcessing}
                className={`playing-card ${spadesSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'} w-16 h-24 text-xl transition-all ${
                  !state.gameOver && isPlayerTurn && !isProcessing
                    ? 'hover:scale-110 hover:-translate-y-2 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                {spadesCardToString(card)}
              </button>
            ))}
          </div>
          {!isPlayerTurn && !state.gameOver && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Waiting for {state.players[state.currentPlayerIndex].name}...
            </p>
          )}
          {isProcessing && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Processing...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OmahaGame({ state, onAction, onExit, isProcessing }: { 
  state: OmahaGameState; 
  onAction: (action: 'fold' | 'check' | 'call' | 'bet', amount?: number) => void; 
  onExit: () => void;
  isProcessing: boolean;
}) {
  const player = state.players.find(p => p.id === 'player')!;
  const isPlayerTurn = state.players[state.currentPlayerIndex].id === 'player';
  
  // Calculate minimum bet (pot limit = pot + current bet + call amount)
  const callAmount = state.currentBet - player.currentBet;
  const potLimitBet = state.pot + state.currentBet + callAmount;
  const minBet = Math.max(10, state.currentBet + 10); // Minimum raise of 10
  const maxBet = Math.min(player.chips, potLimitBet);
  
  const [betAmount, setBetAmount] = useState(minBet);
  const communityCards = getCommunityCardsForStreet(state);

  // Update bet amount when minBet changes
  useEffect(() => {
    setBetAmount(Math.min(Math.max(minBet, betAmount), maxBet));
  }, [minBet, maxBet]);

  const handleBet = () => {
    if (betAmount >= minBet && betAmount <= player.chips) {
      onAction('bet', betAmount);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Pot Limit Omaha</h2>
          <p className="text-muted-foreground mt-1">
            Street: {state.street} | Pot: ${state.pot}
          </p>
        </div>
        <Button onClick={onExit} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Exit Game
        </Button>
      </div>

      {state.gameOver && (
        <Card className="bg-primary/10 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-xl font-bold">Hand Complete!</h3>
                <p className="text-muted-foreground">
                  {state.winner === 'player' ? `You won $${state.pot}!` : `${state.players.find(p => p.id === state.winner)?.name} won $${state.pot}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Community Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-3 min-h-[120px] items-center">
            {communityCards.length === 0 ? (
              <p className="text-muted-foreground">No community cards yet</p>
            ) : (
              communityCards.map((card, idx) => (
                <div
                  key={idx}
                  className={`playing-card ${omahaSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'} w-16 h-24 text-xl`}
                >
                  {omahaCardToString(card)}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Player Info */}
      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {state.players.map(p => (
              <div key={p.id} className={`p-3 rounded-lg ${p.id === state.players[state.currentPlayerIndex].id ? 'bg-primary/20 border border-primary' : 'bg-muted'} ${p.folded ? 'opacity-50' : ''}`}>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  ${p.chips} {p.folded && '(Folded)'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player's Hand */}
      <Card>
        <CardHeader>
          <CardTitle>Your Hand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-center">
            {player.holeCards.map((card, idx) => (
              <div
                key={idx}
                className={`playing-card ${omahaSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'} w-16 h-24 text-xl`}
              >
                {omahaCardToString(card)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Betting Controls */}
      {!state.gameOver && isPlayerTurn && !player.folded && !isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Your Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => onAction('fold')} variant="destructive">
                  Fold
                </Button>
                {canCheck(state, 'player') && (
                  <Button onClick={() => onAction('check')} variant="outline">
                    Check
                  </Button>
                )}
                {canCall(state, 'player') && (
                  <Button onClick={() => onAction('call')} variant="secondary">
                    Call ${state.currentBet}
                  </Button>
                )}
                <Button onClick={handleBet} disabled={betAmount < minBet || betAmount > player.chips}>
                  Bet ${betAmount}
                </Button>
              </div>
              <div className="flex items-center gap-4 justify-center">
                <Button 
                  onClick={() => setBetAmount(Math.max(minBet, betAmount - 10))}
                  variant="outline"
                  size="sm"
                >
                  -$10
                </Button>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(minBet, Math.min(player.chips, parseInt(e.target.value) || minBet)))}
                  className="w-24 text-center border rounded px-2 py-1"
                  min={minBet}
                  max={player.chips}
                />
                <Button 
                  onClick={() => setBetAmount(Math.min(player.chips, betAmount + 10))}
                  variant="outline"
                  size="sm"
                >
                  +$10
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isPlayerTurn && !state.gameOver && (
        <p className="text-center text-muted-foreground">
          Waiting for {state.players[state.currentPlayerIndex].name}...
        </p>
      )}

      {isProcessing && (
        <p className="text-center text-muted-foreground">
          Processing...
        </p>
      )}
    </div>
  );
}
