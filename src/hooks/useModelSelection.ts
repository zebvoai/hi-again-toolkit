import { useState, useEffect } from 'react';
import { ModelSelection } from '@/types/model.types';
import { ModelFactory } from '@/services/ModelFactory';
import { useChat } from '@/contexts/ChatContext';
import { useSettings } from '@/contexts/SettingsContext';

export function useModelSelection() {
  const { currentMode, setModel } = useChat();
  const { credentials, loadingCredentials } = useSettings();
  const [availableModels, setAvailableModels] = useState<ModelSelection[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      if (loadingCredentials) return;

      const models = await ModelFactory.getAvailableModelsForMode(currentMode);
      setAvailableModels(models);

      const defaultModel = await ModelFactory.getDefaultModelForMode(currentMode);
      if (defaultModel) {
        setModel(defaultModel);
      }
    };

    loadModels();
  }, [currentMode, setModel, credentials, loadingCredentials]);

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
