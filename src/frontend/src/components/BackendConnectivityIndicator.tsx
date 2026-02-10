import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useActorWithRetry } from '../hooks/useActorWithRetry';

export default function BackendConnectivityIndicator() {
  const { isConnected, isError, error, retryCount, isRetrying } = useActorWithRetry();

  if (isConnected) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className="gap-1.5 bg-green-600/10 border-green-600/30 text-green-600 dark:text-green-400 hover:bg-green-600/20 cursor-default"
            >
              <Wifi className="h-3 w-3" />
              <span className="text-xs font-semibold">Backend: Connected</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Backend connection is active</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const guidanceText = isRetrying
    ? `Reconnecting to backend... (Attempt ${retryCount})`
    : 'Backend connection unavailable. Try refreshing the page or check back in a moment.';

  const errorMessage = error?.message || 'Unable to connect to the backend service.';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="gap-1.5 bg-amber-600/10 border-amber-600/30 text-amber-600 dark:text-amber-400 hover:bg-amber-600/20 cursor-default"
          >
            {isRetrying ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span className="text-xs font-semibold">
              Backend: {isRetrying ? 'Reconnecting' : 'Not Connected'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-semibold">{guidanceText}</p>
          {isError && !isRetrying && (
            <p className="text-xs mt-1 text-muted-foreground">{errorMessage}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
