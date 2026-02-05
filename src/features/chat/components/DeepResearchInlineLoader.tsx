import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface DeepResearchInlineLoaderProps {
  status?: 'researching' | 'synthesizing' | 'complete';
  elapsedTime?: number;
}

const researchingMessages = [
  'Thinking',
  'Searching sources',
  'Thinking deeper',
  'Reading articles',
  'Analyzing data',
  'Cross-referencing',
  'Gathering insights',
  'Exploring context',
  'Thinking more',
  'Verifying facts',
];

const synthesizingMessages = [
  'Synthesizing',
  'Connecting ideas',
  'Building response',
  'Refining answer',
  'Polishing output',
];

export const DeepResearchInlineLoader = ({ 
  status = 'researching',
  elapsedTime = 0,
}: DeepResearchInlineLoaderProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = status === 'synthesizing' ? synthesizingMessages : researchingMessages;
  
  useEffect(() => {
    if (status === 'complete') return;
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [status, messages.length]);
  
  // Reset index when status changes
  useEffect(() => {
    setMessageIndex(0);
  }, [status]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };
  
  const getMessage = () => {
    if (status === 'complete') return 'Complete';
    return messages[messageIndex];
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 appear-smooth">
      <div className="flex gap-2.5 max-w-[75%]">
        {/* Avatar with subtle pulse */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400/30 to-purple-500/40 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Model name */}
          <div className="flex items-center gap-1.5 mb-1 ml-0.5">
            <span className="text-[10px] font-medium text-indigo-500/80">
              Deep Research
            </span>
          </div>
          
          {/* Minimal inline loader */}
          <div className="rounded-2xl rounded-bl-md bg-card border border-indigo-200/40 dark:border-indigo-800/30 px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Animated dots */}
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500/70 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" />
                <span className="w-1.5 h-1.5 bg-indigo-500/70 rounded-full animate-[bounce_1.4s_ease-in-out_infinite_0.2s]" />
                <span className="w-1.5 h-1.5 bg-indigo-500/70 rounded-full animate-[bounce_1.4s_ease-in-out_infinite_0.4s]" />
              </div>
              
              {/* Status text */}
              <span className="text-[13px] text-muted-foreground">
                {getMessage()}
                <span className="animate-pulse">...</span>
              </span>
              
              {/* Timer - always visible */}
              <span className="text-[11px] text-muted-foreground/50 font-mono tabular-nums ml-auto">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
