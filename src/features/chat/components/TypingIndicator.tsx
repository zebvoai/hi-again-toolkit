import { Bot } from 'lucide-react';

export const TypingIndicator = ({ model }: { model?: string }) => {
  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="max-w-[75%] rounded-2xl px-5 py-4 shadow-sm bg-muted/30 border border-border/50">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-primary" />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              {model || 'AI'} is typing
            </span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
