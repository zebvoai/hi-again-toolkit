import { useState } from 'react';
import { useModels } from '../hooks/useModels';
import { useModeStore } from '@/features/modes/store/modeStore';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export const ModelSelector = ({ values, onChange, disabled }: ModelSelectorProps) => {
  const { models, isLoading } = useModels();
  const { selectedMode } = useModeStore();
  const [open, setOpen] = useState(false);
  
  const availableModels = models ? models[selectedMode] : [];
  
  const handleToggle = (model: string) => {
    if (values.includes(model)) {
      // Remove model
      onChange(values.filter(m => m !== model));
    } else {
      // Add model (max 4)
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
          className="w-auto min-w-[120px] border-0 bg-transparent rounded-lg text-sm px-3 py-1.5 h-8 hover:bg-accent transition-colors justify-between"
        >
          <span>{isLoading ? 'Loading...' : displayText}</span>
          <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Select up to 4 models
          </div>
          {availableModels.map((model) => (
            <button
              key={model}
              onClick={() => handleToggle(model)}
              disabled={!values.includes(model) && values.length >= 4}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                values.includes(model) && "bg-accent"
              )}
            >
              <div className={cn(
                "w-4 h-4 border rounded flex items-center justify-center",
                values.includes(model) ? "bg-blue-600 border-blue-600" : "border-gray-300"
              )}>
                {values.includes(model) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span>{model}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
