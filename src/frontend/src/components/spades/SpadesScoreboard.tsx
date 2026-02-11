import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, AlertTriangle } from 'lucide-react';
import { SpadesGameState } from '../../games/spades/types';
import { TARGET_SCORE } from '../../games/spades/scoring';

interface SpadesScoreboardProps {
  state: SpadesGameState;
  compact?: boolean;
  sticky?: boolean;
}

export default function SpadesScoreboard({ state, compact = false, sticky = false }: SpadesScoreboardProps) {
  // Count reneging penalties per player
  const getPenaltyCount = (playerId: string) => {
    return state.renegePenalties.filter(p => p.playerId === playerId).length;
  };

  const containerClasses = sticky 
    ? 'sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80'
    : '';

  if (compact) {
    return (
      <div className={containerClasses}>
        <Card className="shadow-md">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Target className="h-4 w-4" />
                <span>Target: {TARGET_SCORE}</span>
              </div>
              <div className="text-xs text-muted-foreground">Hand {state.handNumber}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {state.players.map(p => {
                const penaltyCount = getPenaltyCount(p.id);
                return (
                  <div key={p.id} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className={`font-semibold truncate ${p.id === 'player' ? 'text-primary' : ''}`}>
                        {p.name}
                      </span>
                      {penaltyCount > 0 && (
                        <span title={`${penaltyCount} reneging penalties`} className="flex-shrink-0">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold">{p.totalScore}</div>
                      {p.lastHandScore !== 0 && (
                        <div className={`text-xs ${p.lastHandScore > 0 ? 'text-success' : 'text-destructive'}`}>
                          {p.lastHandScore > 0 ? '+' : ''}{p.lastHandScore}
                        </div>
                      )}
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

  return (
    <div className={containerClasses}>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Scores (Target: {TARGET_SCORE})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {state.players.map(p => {
              const penaltyCount = getPenaltyCount(p.id);
              return (
                <div key={p.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div>
                    <span className={`font-semibold ${p.id === 'player' ? 'text-primary' : ''}`}>
                      {p.name}
                    </span>
                    {penaltyCount > 0 && (
                      <span className="ml-2 text-xs text-destructive" title={`${penaltyCount} reneging penalties`}>
                        <AlertTriangle className="inline h-3 w-3" /> {penaltyCount}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{p.totalScore}</div>
                    {p.lastHandScore !== 0 && (
                      <div className={`text-xs ${p.lastHandScore > 0 ? 'text-success' : 'text-destructive'}`}>
                        {p.lastHandScore > 0 ? '+' : ''}{p.lastHandScore}
                      </div>
                    )}
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
