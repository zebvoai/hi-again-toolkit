import { Bot } from 'lucide-react';

export const TypingIndicator = ({ models }: { models?: string[] }) => {
  const displayText = !models || models.length === 0 
    ? 'AI is thinking...'
    : models.length === 1 
    ? `${models[0]} is typing`
    : `${models.length} models are thinking...`;

  return (
    <div className="flex justify-start mb-4 appear-smooth">
      <div className="flex gap-2 max-w-[75%]">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center shadow-sm flex-shrink-0 transition-transform duration-normal ease-spring hover:scale-110">
          <span className="text-blue-700 font-semibold text-sm">Z</span>
        </div>
        
        {/* Typing bubble */}
        <div className="rounded-[18px_18px_18px_4px] px-4 py-3 bg-[#F0F0F0] shadow-sm transition-shadow duration-normal hover:shadow-md">
          <div className="flex gap-1">
            <div 
              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce-subtle" 
              style={{ animationDelay: '0ms' }} 
            />
            <div 
              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce-subtle" 
              style={{ animationDelay: '150ms' }} 
            />
            <div 
              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce-subtle" 
              style={{ animationDelay: '300ms' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
