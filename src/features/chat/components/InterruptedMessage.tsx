import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InterruptedMessageProps {
  mode?: string;
  onRetry?: () => void;
}

export const InterruptedMessage = ({ mode, onRetry }: InterruptedMessageProps) => {
  const modeLabel = mode === 'image' ? 'Image generation' 
    : mode === 'video' ? 'Video generation'
    : mode === 'research' ? 'Deep Research'
    : 'Response generation';

  return (
    <div className="flex justify-start appear-smooth">
      <div className="flex flex-row max-w-[90%] sm:max-w-[75%] gap-2 sm:gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-destructive/15 to-destructive/35 flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="rounded-2xl rounded-bl-md bg-card border border-border/30 px-4 py-3">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {modeLabel} was interrupted. This can happen when the page is refreshed or the browser tab is closed during generation.
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="w-fit gap-1.5 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry generation
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
