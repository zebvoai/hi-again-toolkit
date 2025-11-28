import { useChat } from '@/contexts/ChatContext';
import { useModelSelection } from '@/hooks/useModelSelection';
import { ModelFactory } from '@/services/ModelFactory';
import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ModelSelector() {
  const { currentModel } = useChat();
  const { availableModels, selectModel } = useModelSelection();

  if (availableModels.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No models available - configure API keys
      </div>
    );
  }

  const currentModelConfig = currentModel
    ? ModelFactory.getModelConfig(currentModel.modelId)
    : null;

  return (
    <Select
      value={currentModel?.modelId}
      onValueChange={selectModel}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue>
          {currentModelConfig?.name || 'Select model'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableModels.map((model) => {
          const config = ModelFactory.getModelConfig(model.modelId);
          if (!config) return null;

          return (
            <SelectItem key={model.modelId} value={model.modelId}>
              <div className="flex flex-col">
                <span className="font-medium">{config.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {config.provider}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
