import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle2, Globe, Calendar, Hash, AlertCircle, ExternalLink } from 'lucide-react';
import { useGetCanisterBuildMetadata } from '../hooks/useQueries';
import { getCurrentSiteOrigin, getPublicIcpLink, copyToClipboard } from '../utils/icpLinks';
import { toast } from 'sonner';

export default function LivePublishStatus() {
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [copiedIcpLink, setCopiedIcpLink] = useState(false);
  const { data: buildMetadata, isLoading, isError } = useGetCanisterBuildMetadata();

  const currentOrigin = getCurrentSiteOrigin();
  const publicIcpLink = getPublicIcpLink();

  const handleCopyOrigin = async () => {
    const success = await copyToClipboard(currentOrigin);
    if (success) {
      setCopiedOrigin(true);
      toast.success('Current Site Origin copied to clipboard!');
      setTimeout(() => setCopiedOrigin(false), 2000);
    } else {
      toast.error('Failed to copy Current Site Origin');
    }
  };

  const handleCopyIcpLink = async () => {
    if (!publicIcpLink) {
      toast.error('Public ICP Link not available');
      return;
    }
    const success = await copyToClipboard(publicIcpLink);
    if (success) {
      setCopiedIcpLink(true);
      toast.success('Public ICP Link copied to clipboard!');
      setTimeout(() => setCopiedIcpLink(false), 2000);
    } else {
      toast.error('Failed to copy Public ICP Link');
    }
  };

  const formatBuildTime = (timestamp: bigint | number) => {
    if (!timestamp || timestamp === BigInt(0) || timestamp === 0) {
      return 'Not available';
    }
    
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) / 1000000 : timestamp;
    const date = new Date(ts);
    
    if (isNaN(date.getTime())) {
      return 'Not available';
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Globe className="h-5 w-5" />
          Live App Status
        </CardTitle>
        <CardDescription>
          Your app's current site origin and public ICP gateway link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Site Origin Section */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Current Site Origin</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2 bg-muted rounded-md font-mono text-sm break-all border-2 border-primary/20">
              {currentOrigin}
            </div>
            <Button
              onClick={handleCopyOrigin}
              size="sm"
              variant="outline"
              className="shrink-0 gap-2"
            >
              {copiedOrigin ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This is the URL you're currently viewing
          </p>
        </div>

        {/* Public ICP Link Section */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            Public ICP Link
            <Badge variant="outline" className="text-xs">
              ic0.app
            </Badge>
          </label>
          {publicIcpLink ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2 bg-muted rounded-md font-mono text-sm break-all border-2 border-accent/20">
                  {publicIcpLink}
                </div>
                <Button
                  onClick={handleCopyIcpLink}
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-2"
                >
                  {copiedIcpLink ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your permanent public URL on the Internet Computer network
              </p>
            </>
          ) : (
            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-600 dark:text-amber-400 text-sm">
                <strong>Not available.</strong> The public ICP link will appear after your app is published to the live network.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Backend Build Metadata Section */}
        <div className="space-y-3 pt-2 border-t border-border">
          <label className="text-sm font-semibold text-muted-foreground">Backend Deployment Info</label>
          
          {isLoading && (
            <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/30">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-600 dark:text-blue-400">
                Loading backend status...
              </AlertDescription>
            </Alert>
          )}

          {isError && (
            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-600 dark:text-amber-400">
                <strong>Backend status unavailable.</strong> The backend connection could not be established. Your site URLs are still accessible above.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && buildMetadata && (
            <div className="space-y-3">
              {/* Build Time */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md border border-border">
                <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Last Deployed
                  </div>
                  <div className="text-sm font-medium mt-1 break-words">
                    {formatBuildTime(buildMetadata.buildTime)}
                  </div>
                </div>
              </div>

              {/* Commit Hash */}
              {buildMetadata.commitHash && buildMetadata.commitHash !== '' && (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md border border-border">
                  <Hash className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Build Identifier
                    </div>
                    <div className="text-sm font-mono font-medium mt-1 break-all">
                      {buildMetadata.commitHash}
                    </div>
                  </div>
                </div>
              )}

              {/* DFX Version */}
              {buildMetadata.dfxVersion && buildMetadata.dfxVersion !== '' && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    DFX {buildMetadata.dfxVersion}
                  </Badge>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-2 pt-2">
                <Badge className="bg-green-600 hover:bg-green-700 text-white gap-1.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Backend Connected
                </Badge>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
