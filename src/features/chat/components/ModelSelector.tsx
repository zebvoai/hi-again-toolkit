import { useState } from 'react';
import { useModels } from '../hooks/useModels';
import { useModeStore } from '@/features/modes/store/modeStore';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ModelSelectorProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

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
                      
                      return (
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
                        </button>
                      );
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
  );
};
