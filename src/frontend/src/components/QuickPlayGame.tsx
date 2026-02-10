import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { GameMode } from '../App';

interface QuickPlayGameProps {
  gameType: 'spades' | 'omaha4Card';
  gameMode: GameMode;
  onExit: () => void;
}

export default function QuickPlayGame({ gameType, gameMode, onExit }: QuickPlayGameProps) {
  const gameTitle = gameType === 'spades' ? 'Spades' : 'Pot Limit Omaha';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            {gameTitle}
          </h2>
          <p className="text-muted-foreground mt-2">
            {gameMode === 'real' ? 'Real-money game' : 'Playing against AI bots'}
          </p>
        </div>
        <Button onClick={onExit} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Exit Game
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Interface</CardTitle>
          <CardDescription>
            {gameTitle} gameplay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Coming Soon:</strong> Full {gameTitle} gameplay interface is currently under development. The game logic and UI will be available in the next update.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 p-8 bg-muted/50 rounded-lg text-center">
            <p className="text-lg font-semibold mb-2">Game Preview</p>
            <p className="text-muted-foreground">
              This is where the {gameTitle} game table, cards, and betting controls will appear.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
