import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, ExternalLink, CheckCircle2, Globe } from 'lucide-react';

export default function GoLiveHelp() {
  return (
    <Card className="border-2 border-accent/30 bg-gradient-to-br from-card to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-accent">
          <Lightbulb className="h-5 w-5" />
          How to Publish Your App Live
        </CardTitle>
        <CardDescription>
          Learn how to make your app accessible on the Internet Computer network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Publishing Process */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Publishing Process
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">1. Draft Version:</strong> When you're building your app in Caffeine, 
              you're working on a draft version. This is your development environment where you can test and iterate.
            </p>
            <p>
              <strong className="text-foreground">2. Publish to Live:</strong> Once you're happy with your draft, 
              use the Caffeine platform to publish your changes to the live version. This deploys your app to the 
              Internet Computer network.
            </p>
            <p>
              <strong className="text-foreground">3. Access Your Live App:</strong> After publishing, your app becomes 
              accessible to anyone on the internet through the public ICP gateway.
            </p>
          </div>
        </div>

        {/* Public ICP Link Info */}
        <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/30">
          <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            <strong>Public ICP Gateway Link:</strong> Your live app is accessible via a permanent URL in the format{' '}
            <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded text-xs font-mono">
              https://&lt;canister-id&gt;.ic0.app
            </code>
            . This link is stable and can be shared with anyone.
          </AlertDescription>
        </Alert>

        {/* Where to Find Links */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            Where to Find Your Links
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Current Site Origin:</strong> This is the URL you're currently viewing. 
              In draft mode, this might be a local development URL or a Caffeine preview URL.
            </p>
            <p>
              <strong className="text-foreground">Public ICP Link:</strong> This is your permanent, public URL on the 
              Internet Computer network. It becomes available after you publish your app to live. You can copy this link 
              from the "Live Status" tab and share it with users.
            </p>
          </div>
        </div>

        {/* Additional Tips */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Tip:</strong> The public ICP link (ic0.app) is hosted on the Internet Computer's 
            decentralized network, making your app censorship-resistant and always available. Use the copy buttons above to 
            easily share your app with others.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
