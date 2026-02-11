import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';
import { GameMode } from '../App';
import { useQuickPlaySession } from '../hooks/useQuickPlaySession';
import { SpadesGameState } from '../games/spades/types';
import { OmahaGameState } from '../games/omaha/types';
import { cardToString as spadesCardToString, getSuitColor as spadesSuitColor } from '../games/spades/types';
import { cardToString as omahaCardToString, getSuitColor as omahaSuitColor } from '../games/omaha/types';
import { getCommunityCardsForStreet, canCheck, canCall } from '../games/omaha/engine';

interface QuickPlayGameProps {
  gameType: 'spades' | 'omaha4Card';
  gameMode: GameMode;
  onExit: () => void;
  playerName: string;
}

export default function QuickPlayGame({ gameType, gameMode, onExit, playerName }: QuickPlayGameProps) {
  const { session, isProcessing, startGame, playCard, performOmahaAction, resetGame } = useQuickPlaySession();

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
    return <SpadesGame state={session.state as SpadesGameState} onPlayCard={playCard} onExit={handleExit} isProcessing={isProcessing} />;
  } else {
    return <OmahaGame state={session.state as OmahaGameState} onAction={performOmahaAction} onExit={handleExit} isProcessing={isProcessing} />;
  }
}

function SpadesGame({ state, onPlayCard, onExit, isProcessing }: { 
  state: SpadesGameState; 
  onPlayCard: (card: any) => void; 
  onExit: () => void;
  isProcessing: boolean;
}) {
  const player = state.players.find(p => p.id === 'player')!;
  const isPlayerTurn = state.players[state.currentPlayerIndex].id === 'player';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Spades</h2>
          <p className="text-muted-foreground mt-1">
            Tricks won: {player.tricksWon} | Spades broken: {state.spadesBroken ? 'Yes' : 'No'}
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Trick */}
      <Card>
        <CardHeader>
          <CardTitle>Current Trick</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4 min-h-[120px] items-center">
            {state.currentTrick.cards.length === 0 ? (
              <p className="text-muted-foreground">No cards played yet</p>
            ) : (
              state.currentTrick.cards.map((played, idx) => (
                <div key={idx} className="text-center">
                  <div className={`playing-card ${spadesSuitColor(played.card.suit) === 'red' ? 'card-red' : 'card-black'} w-20 h-28 text-2xl`}>
                    {spadesCardToString(played.card)}
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">
                    {state.players.find(p => p.id === played.playerId)?.name}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Player Hand */}
      <Card>
        <CardHeader>
          <CardTitle>
            Your Hand {isPlayerTurn && !state.gameOver && <span className="text-primary">(Your Turn)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-center">
            {player.hand.map((card, idx) => (
              <button
                key={idx}
                onClick={() => !isProcessing && isPlayerTurn && !state.gameOver && onPlayCard(card)}
                disabled={!isPlayerTurn || state.gameOver || isProcessing}
                className={`playing-card ${spadesSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'} w-16 h-24 text-xl ${
                  !isPlayerTurn || state.gameOver ? 'disabled' : ''
                }`}
              >
                {spadesCardToString(card)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scoreboard */}
      <Card>
        <CardHeader>
          <CardTitle>Scoreboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {state.players.map(p => (
              <div key={p.id} className={`p-3 rounded-lg ${p.id === state.players[state.currentPlayerIndex].id ? 'bg-primary/20 border border-primary' : 'bg-muted'}`}>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">Tricks: {p.tricksWon}</p>
              </div>
            ))}
          </div>
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
  const communityCards = getCommunityCardsForStreet(state);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Pot Limit Omaha</h2>
          <p className="text-muted-foreground mt-1">
            Street: {state.street.toUpperCase()} | Pot: ${state.pot} | Your chips: ${player.chips}
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
                <p className="text-sm text-muted-foreground">{state.winningHand}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Poker Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="poker-table aspect-[2/1] flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-white text-2xl font-bold mb-4">POT: ${state.pot}</p>
              <div className="flex gap-3 justify-center flex-wrap">
                {communityCards.length === 0 ? (
                  <p className="text-white/70">Waiting for flop...</p>
                ) : (
                  communityCards.map((card, idx) => (
                    <div key={idx} className={`playing-card ${omahaSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'} w-16 h-24 text-xl`}>
                      {omahaCardToString(card)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Hand */}
      <Card>
        <CardHeader>
          <CardTitle>
            Your Hand {isPlayerTurn && !state.gameOver && <span className="text-primary">(Your Turn)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 justify-center mb-6">
            {player.holeCards.map((card, idx) => (
              <div key={idx} className={`playing-card ${omahaSuitColor(card.suit) === 'red' ? 'card-red' : 'card-black'} w-20 h-28 text-2xl`}>
                {omahaCardToString(card)}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {isPlayerTurn && !state.gameOver && !player.folded && (
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => onAction('fold')} disabled={isProcessing} variant="destructive">
                Fold
              </Button>
              {canCheck(state, 'player') && (
                <Button onClick={() => onAction('check')} disabled={isProcessing} variant="secondary">
                  Check
                </Button>
              )}
              {canCall(state, 'player') && (
                <Button onClick={() => onAction('call')} disabled={isProcessing} variant="default">
                  Call ${state.currentBet - player.currentBet}
                </Button>
              )}
              <Button onClick={() => onAction('bet', 50)} disabled={isProcessing || player.chips < 50} className="bg-primary">
                Bet $50
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Players */}
      <Card>
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {state.players.map(p => (
              <div key={p.id} className={`p-3 rounded-lg ${p.id === state.players[state.currentPlayerIndex].id ? 'bg-primary/20 border border-primary' : 'bg-muted'} ${p.folded ? 'opacity-50' : ''}`}>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">Chips: ${p.chips}</p>
                <p className="text-sm text-muted-foreground">Bet: ${p.currentBet}</p>
                {p.folded && <p className="text-xs text-destructive">Folded</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
