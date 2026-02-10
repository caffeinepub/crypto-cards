import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle2, Globe, Calendar, Hash, AlertCircle } from 'lucide-react';
import { useGetCanisterBuildMetadata } from '../hooks/useQueries';
import { toast } from 'sonner';

export default function LivePublishStatus() {
  const [copied, setCopied] = useState(false);
  const { data: buildMetadata, isLoading, isError } = useGetCanisterBuildMetadata();

  const liveUrl = window.location.origin;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      toast.success('URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
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
          Your app's live URL and deployment information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live URL Section */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground">Live URL</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2 bg-muted rounded-md font-mono text-sm break-all border-2 border-primary/20">
              {liveUrl}
            </div>
            <Button
              onClick={handleCopyUrl}
              size="sm"
              variant="outline"
              className="shrink-0 gap-2"
            >
              {copied ? (
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
                <strong>Backend status unavailable.</strong> The backend connection could not be established. Your live URL is still accessible above.
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
