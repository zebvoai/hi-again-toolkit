import { useState } from 'react';
import { useModels } from '../hooks/useModels';
import { useModeStore } from '@/features/modes/store/modeStore';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, ChevronDown, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModelSelectorProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

// Model descriptions and capabilities
const modelInfo: Record<string, { description: string; strengths: string[]; speed: string }> = {
  'GPT-5': {
    description: 'Most advanced GPT model with superior reasoning and multimodal capabilities',
    strengths: ['Complex reasoning', 'Long context', 'Multimodal', 'High accuracy'],
    speed: 'Moderate'
  },
  'GPT-5 Mini': {
    description: 'Balanced performance with lower cost and faster responses',
    strengths: ['Good reasoning', 'Cost effective', 'Fast responses', 'Multimodal'],
    speed: 'Fast'
  },
  'GPT-5 Nano': {
    description: 'Ultra-fast model optimized for high-volume simple tasks',
    strengths: ['Very fast', 'Low cost', 'High throughput', 'Simple tasks'],
    speed: 'Very Fast'
  },
  'Claude Sonnet 4.5': {
    description: 'Most intelligent Anthropic model with exceptional reasoning',
    strengths: ['Superior reasoning', 'Complex analysis', 'Long context', 'Vision'],
    speed: 'Moderate'
  },
  'Claude Opus 4': {
    description: 'Highly intelligent model with advanced capabilities',
    strengths: ['Deep reasoning', 'Complex tasks', 'High accuracy', 'Extended context'],
    speed: 'Moderate'
  },
  'Claude Sonnet 3.5': {
    description: 'High-performance model with excellent reasoning and efficiency',
    strengths: ['Balanced performance', 'Good reasoning', 'Efficient', 'Vision'],
    speed: 'Fast'
  },
  'Claude Haiku 3.5': {
    description: 'Fastest Claude model for quick, straightforward responses',
    strengths: ['Very fast', 'Cost effective', 'Quick responses', 'Simple tasks'],
    speed: 'Very Fast'
  },
  'Gemini 2.5 Pro': {
    description: 'Top-tier Gemini with best multimodal and reasoning capabilities',
    strengths: ['Multimodal excellence', 'Large context', 'Complex reasoning', 'Vision'],
    speed: 'Moderate'
  },
  'Gemini 2.5 Flash': {
    description: 'Balanced Gemini model with good performance and speed',
    strengths: ['Fast responses', 'Good reasoning', 'Multimodal', 'Cost effective'],
    speed: 'Fast'
  },
  'Gemini 2.5 Flash Lite': {
    description: 'Fastest Gemini model for classification and simple workloads',
    strengths: ['Very fast', 'Low cost', 'Simple tasks', 'High volume'],
    speed: 'Very Fast'
  }
};

// Model grouping by provider
const getModelProvider = (model: string): string => {
  if (model.includes('GPT') || model.includes('gpt')) return 'OpenAI';
  if (model.includes('Claude') || model.includes('claude')) return 'Anthropic';
  if (model.includes('Gemini') || model.includes('gemini')) return 'Google';
  return 'Other';
};

const getModelTier = (model: string): 'premium' | 'standard' | 'fast' => {
  const modelLower = model.toLowerCase();
  if (modelLower.includes('pro') || modelLower.includes('opus')) return 'premium';
  if (modelLower.includes('mini') || modelLower.includes('nano') || modelLower.includes('flash')) return 'fast';
  return 'standard';
};

export const ModelSelector = ({ values, onChange, disabled }: ModelSelectorProps) => {
  const { models, isLoading } = useModels();
  const { selectedMode } = useModeStore();
  const [open, setOpen] = useState(false);
  
  const availableModels = models ? models[selectedMode] : [];
  
  // Group models by provider
  const groupedModels = availableModels.reduce((acc, model) => {
    const provider = getModelProvider(model);
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, string[]>);
  
  const handleToggle = (model: string) => {
    if (values.includes(model)) {
      onChange(values.filter(m => m !== model));
    } else {
      if (values.length < 4) {
        onChange([...values, model]);
      }
    }
  };
  
  const displayText = values.length === 0 
    ? 'Select models' 
    : values.length === 1 
    ? values[0] 
    : `${values.length} models`;
  
  return (
    <TooltipProvider delayDuration={300}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            disabled={disabled || isLoading}
            className={cn(
              "w-auto min-w-[140px] border border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl text-sm px-3 py-2 h-9 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-200 shadow-sm hover:shadow-md justify-between",
              values.length > 0 && "bg-white/80 dark:bg-gray-900/80"
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{isLoading ? 'Loading...' : displayText}</span>
            </div>
            <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[320px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-2xl p-3 z-[100]" 
          align="start"
        >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Select Models</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Choose up to 4 models • {values.length}/4 selected
              </p>
            </div>
          </div>
          
          {/* Models List with ScrollArea */}
          <ScrollArea className="h-[280px] pr-2">
            <div className="space-y-4">
              {Object.entries(groupedModels).map(([provider, providerModels]) => (
                <div key={provider} className="space-y-2">
                  {/* Provider Label */}
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {provider}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                  </div>
                  
                  {/* Models in this provider */}
                  <div className="space-y-1">
                    {providerModels.map((model) => {
                      const isSelected = values.includes(model);
                      const isDisabled = !isSelected && values.length >= 4;
                      const tier = getModelTier(model);
                      const info = modelInfo[model];
                      
                      const modelButton = (
                        <button
                          key={model}
                          onClick={() => handleToggle(model)}
                          disabled={isDisabled}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                            "hover:bg-blue-50/80 dark:hover:bg-blue-900/20",
                            isSelected && "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500/20",
                            isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                          )}
                        >
                          {/* Checkbox */}
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                            isSelected 
                              ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 shadow-lg shadow-blue-500/30" 
                              : "border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                          
                          {/* Model Info */}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-medium truncate",
                                isSelected ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"
                              )}>
                                {model}
                              </span>
                              {tier === 'premium' && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-md">
                                  PRO
                                </span>
                              )}
                              {tier === 'fast' && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-green-400 to-green-500 text-white rounded-md">
                                  FAST
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Info Icon */}
                          {info && (
                            <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                      
                      return info ? (
                        <Tooltip key={model}>
                          <TooltipTrigger asChild>
                            {modelButton}
                          </TooltipTrigger>
                          <TooltipContent 
                            side="left" 
                            className="max-w-[280px] bg-gray-900/98 dark:bg-gray-800/98 backdrop-blur-xl border border-gray-700/50 p-4 z-[150]"
                            sideOffset={8}
                          >
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-semibold text-white text-sm mb-1">{model}</h4>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                  {info.description}
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Speed:</span>
                                  <span className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                    info.speed === 'Very Fast' && "bg-green-500/20 text-green-400",
                                    info.speed === 'Fast' && "bg-blue-500/20 text-blue-400",
                                    info.speed === 'Moderate' && "bg-amber-500/20 text-amber-400"
                                  )}>
                                    {info.speed}
                                  </span>
                                </div>
                                
                                <div>
                                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block mb-1.5">
                                    Key Strengths:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {info.strengths.map((strength, idx) => (
                                      <span 
                                        key={idx}
                                        className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-md border border-blue-500/20"
                                      >
                                        {strength}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : modelButton;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {/* Footer Info */}
          {values.length >= 4 && (
            <div className="px-2 py-2 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-400 text-center">
                Maximum of 4 models selected
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
    </TooltipProvider>
  );
};
