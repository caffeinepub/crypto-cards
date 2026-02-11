import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Percent, Save, AlertCircle, CheckCircle2, DollarSign, Wallet, UserPlus, UserMinus, Users, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [newPercent, setNewPercent] = useState<string>('');

  // Placeholder values since backend methods are not yet implemented
  const currentPercent = 5;
  const isLoadingHouseCut = false;
  const isLoadingStats = false;

  const handleUpdateHouseCut = async () => {
    const percentValue = parseInt(newPercent);
    
    if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
      toast.error('Invalid percentage', {
        description: 'Please enter a value between 0 and 100',
      });
      return;
    }

    toast.info('House cut update coming soon', {
      description: 'This feature will be available once backend methods are implemented',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Admin Settings
        </h2>
        <p className="text-muted-foreground mt-2">
          Configure platform settings and manage system operations
        </p>
      </div>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access Granted</strong> - You have full administrative privileges to manage platform settings.
        </AlertDescription>
      </Alert>

      {/* System Statistics Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Real-Time System Statistics
          </CardTitle>
          <CardDescription>
            Live platform metrics and activity overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                System statistics will be available once backend methods are implemented.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* House Cut Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            House Cut Configuration
          </CardTitle>
          <CardDescription>
            Set the percentage of winnings that goes to the platform. This applies to all real-money games and tournaments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current House Cut</p>
              <p className="text-3xl font-bold mt-1">
                {isLoadingHouseCut ? '...' : `${currentPercent}%`}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Active
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="house-cut">New House Cut Percentage</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="house-cut"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter percentage (0-100)"
                    value={newPercent}
                    onChange={(e) => setNewPercent(e.target.value)}
                    className="pr-8"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <Button 
                  onClick={handleUpdateHouseCut}
                  disabled={!newPercent}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The house cut is automatically deducted from total winnings before distributing to players.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Changes to the house cut percentage will apply to all new games and tournaments immediately. Existing active games will continue with their original house cut rate.
              </AlertDescription>
            </Alert>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">How House Cut Works</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>The house cut is calculated as a percentage of the total prize pool</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>It is automatically deducted before distributing winnings to players</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>The cut is transferred to the admin wallet address</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Default house cut is set to 5% for all games</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* User Role Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Role Management
          </CardTitle>
          <CardDescription>
            Assign or revoke admin and user privileges for platform members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Coming Soon:</strong> User role management interface will allow you to assign or revoke admin/user privileges. This feature is currently under development.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button variant="outline" disabled className="gap-2 flex-1">
              <UserPlus className="w-4 h-4" />
              Assign Admin Role
            </Button>
            <Button variant="outline" disabled className="gap-2 flex-1">
              <UserMinus className="w-4 h-4" />
              Revoke Admin Role
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Role Management Features</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Promote users to admin status with full platform privileges</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Revoke admin privileges and demote to regular user status</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>View complete list of all platform users and their roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Audit trail of all role changes and administrative actions</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
