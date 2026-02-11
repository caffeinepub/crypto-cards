import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Zap, Spade, Diamond } from 'lucide-react';
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
          <span className="gradient-text">Game Lobbies</span>
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
          <strong>Coming Soon:</strong> Lobby browsing and multiplayer matchmaking features are currently under development.
        </AlertDescription>
      </Alert>

      {/* Quick Play Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          Quick Play
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => onQuickPlay('spades')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Spade className="w-5 h-5" />
                Spades
              </CardTitle>
              <CardDescription>
                Classic trick-taking game. Win tricks and avoid penalties.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Play Spades
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => onQuickPlay('omaha4Card')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Diamond className="w-5 h-5" />
                Pot Limit Omaha
              </CardTitle>
              <CardDescription>
                4-card Omaha poker. Use exactly 2 hole cards + 3 community cards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Play Omaha
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
