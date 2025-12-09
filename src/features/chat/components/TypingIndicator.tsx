import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

export const TypingIndicator = ({ models }: { models?: string[] }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Live timer that counts up every second
  useEffect(() => {
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const displayText = !models || models.length === 0 
    ? 'AI is thinking...'
    : models.length === 1 
    ? `${models[0]} is typing`
    : `${models.length} models are thinking...`;

  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div className="flex gap-2 max-w-[75%]">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.08)] flex-shrink-0">
          <span className="text-blue-700 font-semibold text-sm">Z</span>
        </div>
        
        {/* Typing bubble */}
        <div className="rounded-[18px_18px_18px_4px] px-4 py-3 bg-[#F0F0F0] shadow-sm">
          <div className="flex items-center gap-3">
            {/* Animated dots */}
            <div className="flex gap-1">
              <div 
                className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" 
                style={{ animationDuration: '1.2s', animationDelay: '0ms' }} 
              />
              <div 
                className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" 
                style={{ animationDuration: '1.2s', animationDelay: '200ms' }} 
              />
              <div 
                className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" 
                style={{ animationDuration: '1.2s', animationDelay: '400ms' }} 
              />
            </div>
            
            {/* Live timer */}
            <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium border-l border-gray-300 pl-3">
              <Timer className="w-3.5 h-3.5" />
              <span className="tabular-nums">{formatTime(elapsedSeconds)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
