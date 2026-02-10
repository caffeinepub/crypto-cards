import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Bot, Wifi } from 'lucide-react';
import { GameMode } from '../App';

interface TournamentSectionProps {
  gameMode: GameMode;
}

export default function TournamentSection({ gameMode }: TournamentSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          Tournaments
          {gameMode === 'real' && <Wifi className="w-6 h-6 text-green-500" />}
        </h2>
        <p className="text-muted-foreground">
          {gameMode === 'real'
            ? 'Compete in tournaments with real players and crypto prizes'
            : 'Tournament mode with AI opponents'}
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/generated/tournament-trophy-transparent.dim_64x64.png" 
              alt="Tournament" 
              className="w-16 h-16 opacity-50"
            />
          </div>
          <CardTitle>Tournaments Coming Soon</CardTitle>
          <CardDescription>
            {gameMode === 'real'
              ? 'Multi-round tournaments with real crypto prizes on Base network'
              : 'Multi-round tournaments with AI opponents and simulated prizes'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <Badge variant="outline">
              <Trophy className="w-3 h-3 mr-1" />
              Prize Pools
            </Badge>
            {gameMode === 'fun' && (
              <Badge variant="outline">
                <Bot className="w-3 h-3 mr-1" />
                AI Support
              </Badge>
            )}
            {gameMode === 'real' && (
              <Badge variant="default" className="bg-green-600">
                Live Network
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Tournament functionality will be available in a future update. 
            {gameMode === 'real' 
              ? ' Compete for real crypto prizes with players worldwide.'
              : ' Practice with AI opponents to prepare for competitive play.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
