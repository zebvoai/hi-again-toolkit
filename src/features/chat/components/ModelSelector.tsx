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
      <SelectTrigger className="w-auto border-border bg-background rounded-lg text-sm px-3 py-1.5 h-8">
        <SelectValue placeholder={isLoading ? "Loading models..." : "Select model"} />
      </SelectTrigger>
      <SelectContent>
        {availableModels.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
