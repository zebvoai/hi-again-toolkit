import { useState, useEffect } from 'react';
import { ModelSelection } from '@/types/model.types';
import { InteractionMode } from '@/types/chat.types';
import { ModelFactory } from '@/services/ModelFactory';
import { useChat } from '@/contexts/ChatContext';

export function useModelSelection() {
  const { currentMode, setModel } = useChat();
  const [availableModels, setAvailableModels] = useState<ModelSelection[]>([]);

  useEffect(() => {
    const models = ModelFactory.getAvailableModelsForMode(currentMode);
    setAvailableModels(models);

    const defaultModel = ModelFactory.getDefaultModelForMode(currentMode);
    if (defaultModel) {
      setModel(defaultModel);
    }
  }, [currentMode, setModel]);

  const selectModel = (modelId: string) => {
    const model = availableModels.find(m => m.modelId === modelId);
    if (model) {
      setModel(model);
    }
  };

  return {
    availableModels,
    selectModel,
  };
}
