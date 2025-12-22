import { useState, useEffect } from 'react';
import { Search, FileText, Brain, Sparkles, PenTool, CheckCircle } from 'lucide-react';

interface DeepResearchIndicatorProps {
  status?: 'searching' | 'reading' | 'reasoning' | 'synthesizing' | 'writing' | 'complete';
  elapsedTime?: number;
  sourcesCount?: number;
}

const stages = [
  { id: 'searching', label: 'Searching sources...', icon: Search, description: 'Finding relevant information across the web' },
  { id: 'reading', label: 'Reading documents...', icon: FileText, description: 'Analyzing and extracting key information' },
  { id: 'reasoning', label: 'Reasoning...', icon: Brain, description: 'Connecting insights and forming conclusions' },
  { id: 'synthesizing', label: 'Synthesizing...', icon: Sparkles, description: 'Combining findings into a coherent analysis' },
  { id: 'writing', label: 'Writing final output...', icon: PenTool, description: 'Composing the research report' },
  { id: 'complete', label: 'Research complete', icon: CheckCircle, description: 'Your research is ready' },
];

export const DeepResearchIndicator = ({ 
  status = 'searching', 
  elapsedTime = 0,
  sourcesCount = 0 
}: DeepResearchIndicatorProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  
  useEffect(() => {
    const stageIndex = stages.findIndex(s => s.id === status);
    if (stageIndex !== -1) {
      setCurrentStageIndex(stageIndex);
    }
  }, [status]);
  
  const currentStage = stages[currentStageIndex];
  const IconComponent = currentStage.icon;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };
  
  return (
    <div className="flex justify-start px-4 sm:px-6 lg:px-8 mb-4">
      <div className="max-w-2xl w-full">
        {/* Main research container */}
        <div className="relative bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-purple-50/40 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-purple-950/20 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5 animate-research-glow">
          
          {/* Breathing background effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/5 via-indigo-400/10 to-purple-400/5 animate-research-breathe pointer-events-none" />
          
          {/* Header */}
          <div className="relative flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-research-pulse">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Deep Research</h3>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Comprehensive multi-source analysis</p>
            </div>
          </div>
          
          {/* Current status */}
          <div className="relative flex items-center gap-3 mb-4 p-3 bg-white/60 dark:bg-gray-900/40 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-research-icon" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 animate-research-status-text">
                {currentStage.label}
              </p>
              <p className="text-xs text-indigo-600/60 dark:text-indigo-400/60">
                {currentStage.description}
              </p>
            </div>
          </div>
          
          {/* Progress stages */}
          <div className="relative flex items-center justify-between mb-4">
            {stages.slice(0, 5).map((stage, index) => {
              const StageIcon = stage.icon;
              const isActive = index === currentStageIndex;
              const isComplete = index < currentStageIndex;
              
              return (
                <div key={stage.id} className="flex flex-col items-center gap-1.5">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isComplete 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                        : isActive 
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-transparent animate-research-pulse'
                          : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    <StageIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors duration-300 ${
                    isComplete || isActive 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {stage.id.charAt(0).toUpperCase() + stage.id.slice(1, 4)}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Progress bar */}
          <div className="relative h-1.5 bg-indigo-100/80 dark:bg-indigo-900/30 rounded-full overflow-hidden mb-4">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out animate-research-progress"
              style={{ width: `${((currentStageIndex + 1) / stages.length) * 100}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
          
          {/* Stats row */}
          <div className="relative flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              {sourcesCount > 0 && (
                <span className="flex items-center gap-1.5 text-indigo-600/80 dark:text-indigo-400/80">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{sourcesCount} sources</span>
                </span>
              )}
            </div>
            <span className="text-indigo-600/60 dark:text-indigo-400/60 font-mono">
              {formatTime(elapsedTime)}
            </span>
          </div>
          
          {/* Calming message */}
          <div className="relative mt-4 pt-4 border-t border-indigo-100/50 dark:border-indigo-800/30">
            <p className="text-xs text-center text-indigo-600/50 dark:text-indigo-400/50 italic animate-research-breathe">
              Deep research takes a few minutes for thorough analysis...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
