import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function LobbyRoom() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lobby Room</CardTitle>
        <CardDescription>
          Multiplayer lobby interface
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Coming Soon:</strong> Multiplayer lobby rooms are currently under development.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
