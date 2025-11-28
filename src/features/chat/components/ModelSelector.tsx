import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModels } from '../hooks/useModels';
import { useModeStore } from '@/features/modes/store/modeStore';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const ModelSelector = ({ value, onChange }: ModelSelectorProps) => {
  const { models, isLoading } = useModels();
  const { selectedMode } = useModeStore();
  
  // Get models for current mode
  const availableModels = models ? models[selectedMode] : [];
  
  // Set default if current value not in list
  if (availableModels.length > 0 && !availableModels.includes(value)) {
    onChange(availableModels[0]);
  }
  
  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className="w-auto border-0 bg-transparent rounded-lg text-sm px-3 py-1.5 h-8 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-colors">
        <SelectValue placeholder={isLoading ? "Loading models..." : "Select model"} />
      </SelectTrigger>
      <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-2xl z-50">
        {availableModels.map((model) => (
          <SelectItem 
            key={model} 
            value={model}
            className="hover:bg-white/50 dark:hover:bg-gray-700/50 focus:bg-white/50 dark:focus:bg-gray-700/50"
          >
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
