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
  
  const availableModels = models ? models[selectedMode] : [];
  
  if (availableModels.length > 0 && !availableModels.includes(value)) {
    onChange(availableModels[0]);
  }
  
  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className="w-auto min-w-[120px] border-0 bg-transparent rounded-lg text-sm px-3 py-1.5 h-8 hover:bg-accent transition-colors">
        <SelectValue placeholder={isLoading ? "Loading..." : "Select model"} />
      </SelectTrigger>
      <SelectContent className="bg-background backdrop-blur-xl border shadow-lg z-[100]">
        {availableModels.map((model) => (
          <SelectItem 
            key={model} 
            value={model}
            className="hover:bg-accent focus:bg-accent cursor-pointer"
          >
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
