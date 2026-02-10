import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameMode } from '../App';

interface LobbyBrowserProps {
  gameMode: GameMode;
  onQuickPlay: (gameType: 'spades' | 'omaha4Card') => void;
}

export default function LobbyBrowser({ gameMode, onQuickPlay }: LobbyBrowserProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="w-8 h-8 text-primary" />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Game Lobbies
          </span>
        </h2>
        <p className="text-muted-foreground mt-2">
          {gameMode === 'real'
            ? 'Browse active lobbies or create your own real-money game'
            : 'Play against AI bots in offline mode'}
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Coming Soon:</strong> Lobby browsing and multiplayer matchmaking features are currently under development. Use Quick Play to start a game now.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Quick Play</CardTitle>
          <CardDescription>
            Start a game instantly with AI opponents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => onQuickPlay('spades')}
              size="lg"
              className="h-24 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              Play Spades
            </Button>
            <Button
              onClick={() => onQuickPlay('omaha4Card')}
              size="lg"
              className="h-24 text-lg font-bold bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
            >
              Play Pot Limit Omaha
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
