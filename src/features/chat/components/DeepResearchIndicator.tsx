import { useState, useEffect } from 'react';
import { Search, Brain, CheckCircle, Sparkles, Layers } from 'lucide-react';

interface DeepResearchIndicatorProps {
  status?: 'researching' | 'synthesizing' | 'complete';
  phase?: 'parallel' | 'synthesis' | 'done';
  progress?: number;
  elapsedTime?: number;
}

const stages = [
  { 
    id: 'researching', 
    label: 'Gathering insights...', 
    shortLabel: 'Research', 
    icon: Search, 
    description: 'Top AI models are analyzing your question in parallel' 
  },
  { 
    id: 'synthesizing', 
    label: 'Synthesizing...', 
    shortLabel: 'Synthesize', 
    icon: Brain, 
    description: 'Our AI moderator is summarizing the findings' 
  },
  { 
    id: 'complete', 
    label: 'Complete', 
    shortLabel: 'Done', 
    icon: CheckCircle, 
    description: 'Your deep research is ready' 
  },
];

export const DeepResearchIndicator = ({ 
  status = 'researching', 
  phase = 'parallel',
  progress = 0,
  elapsedTime = 0,
}: DeepResearchIndicatorProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  
  // Update stage index when status changes
  useEffect(() => {
    const stageIndex = stages.findIndex(s => s.id === status);
    if (stageIndex !== -1) {
      setCurrentStageIndex(stageIndex);
    }
  }, [status]);
  
  const currentStage = stages[currentStageIndex];
  const IconComponent = currentStage.icon;
  const progressPercent = Math.max(progress * 100, ((currentStageIndex + 0.5) / stages.length) * 100);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };
  
  // Get phase-specific messaging
  const getPhaseDetails = () => {
    if (phase === 'parallel') {
      return {
        label: 'Multiple models analyzing',
        icon: Layers,
      };
    } else if (phase === 'synthesis') {
      return {
        label: 'AI moderator synthesizing',
        icon: Brain,
      };
    }
    return { label: 'Complete', icon: CheckCircle };
  };
  
  const phaseDetails = getPhaseDetails();
  const PhaseIcon = phaseDetails.icon;
  
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
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">Deep Research</h3>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Multi-model analysis & synthesis</p>
            </div>
          </div>
          
          {/* Current status - fixed height to prevent jumping */}
          <div className="relative flex items-center gap-3 mb-4 p-3 bg-white/60 dark:bg-gray-900/40 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30 min-h-[72px]">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-research-icon" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 transition-opacity duration-300">
                {currentStage.label}
              </p>
              <p className="text-xs text-indigo-600/60 dark:text-indigo-400/60 truncate">
                {currentStage.description}
              </p>
            </div>
          </div>
          
          {/* Active phase indicator */}
          {status !== 'complete' && (
            <div className="relative flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <PhaseIcon className="w-3 h-3" />
                {phaseDetails.label}
              </span>
            </div>
          )}
          
          {/* Progress stages */}
          <div className="relative flex items-center justify-between mb-4">
            {stages.map((stage, index) => {
              const StageIcon = stage.icon;
              const isActive = index === currentStageIndex;
              const isComplete = index < currentStageIndex;
              
              return (
                <div key={stage.id} className="flex flex-col items-center gap-1.5 flex-1">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isComplete 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                        : isActive 
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-transparent animate-research-pulse'
                          : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    <StageIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors duration-300 text-center whitespace-nowrap ${
                    isComplete || isActive 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {stage.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Progress bar - stable width */}
          <div className="relative h-1.5 bg-indigo-100/80 dark:bg-indigo-900/30 rounded-full overflow-hidden mb-4">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-[width] duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
          
          {/* Timer */}
          <div className="relative flex items-center justify-end text-xs min-h-[20px]">
            <span className="text-indigo-600/60 dark:text-indigo-400/60 font-mono tabular-nums">
              {formatTime(elapsedTime)}
            </span>
          </div>
          
          {/* Calming message */}
          <div className="relative mt-4 pt-4 border-t border-indigo-100/50 dark:border-indigo-800/30">
            <p className="text-xs text-center text-indigo-600/50 dark:text-indigo-400/50 italic animate-research-breathe">
              Deep research takes a moment for thorough analysis...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
