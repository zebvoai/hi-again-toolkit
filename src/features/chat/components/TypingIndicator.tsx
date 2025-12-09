import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

// Get estimated time in seconds based on model tier
const getEstimatedSeconds = (models: string[]): number => {
  if (!models || models.length === 0) return 8;
  
  // Use the slowest model's estimate when multiple models selected
  let maxTime = 0;
  
  for (const model of models) {
    const modelLower = model.toLowerCase();
    let time = 6; // default
    
    // Speed models - fast
    if (modelLower.includes('nano') || modelLower.includes('lite') || 
        modelLower.includes('haiku') || (modelLower.includes('flash') && !modelLower.includes('pro')) ||
        modelLower.includes('mini') || modelLower.includes('nemo') ||
        modelLower.includes('fast') || modelLower.includes('phi-4') ||
        modelLower.includes('schnell') || modelLower.includes('turbo')) {
      time = 4;
    }
    // Premium models - slower
    else if (modelLower.includes('pro') || modelLower.includes('opus') || 
        modelLower.includes('sonnet') || modelLower.includes('large') || 
        (modelLower.includes('gpt-5') && !modelLower.includes('nano') && !modelLower.includes('mini')) ||
        modelLower.includes('o3') || modelLower.includes('deepseek r1') ||
        modelLower.includes('llama 4') || modelLower.includes('405b') ||
        modelLower.includes('nemotron') || modelLower.includes('command r+') ||
        modelLower.includes('ultra')) {
      time = 12;
    }
    
    maxTime = Math.max(maxTime, time);
  }
  
  return maxTime;
};

export const TypingIndicator = ({ models }: { models?: string[] }) => {
  const estimatedTime = getEstimatedSeconds(models || []);
  const [remainingSeconds, setRemainingSeconds] = useState(estimatedTime);
  
  // Countdown timer
  useEffect(() => {
    setRemainingSeconds(estimatedTime);
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) return estimatedTime; // Reset when reaches 0
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [estimatedTime]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `~${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${mins}m ${secs}s`;
  };

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
            
            {/* Countdown timer */}
            <div className="flex items-center gap-1.5 text-[12px] text-gray-500 font-medium border-l border-gray-300 pl-3">
              <Timer className="w-3.5 h-3.5" />
              <span className="tabular-nums">{formatTime(remainingSeconds)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
