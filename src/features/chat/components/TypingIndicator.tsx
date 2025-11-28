import { Bot } from 'lucide-react';

export const TypingIndicator = ({ models }: { models?: string[] }) => {
  const displayText = !models || models.length === 0 
    ? 'AI is thinking...'
    : models.length === 1 
    ? `${models[0]} is typing`
    : `${models.length} models are thinking...`;

  return (
    <div className="flex justify-start mb-6 animate-fade-in">
      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md mr-3 flex-shrink-0">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="max-w-[70%] rounded-2xl px-5 py-3.5 shadow-sm bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              {displayText}
            </span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce shadow-sm" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce shadow-sm" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce shadow-sm" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
