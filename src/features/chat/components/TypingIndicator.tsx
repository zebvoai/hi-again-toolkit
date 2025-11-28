import { Bot } from 'lucide-react';

export const TypingIndicator = ({ model }: { model?: string }) => {
  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="max-w-[75%] rounded-2xl px-5 py-4 shadow-xl bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              {model || 'AI'} is typing
            </span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
