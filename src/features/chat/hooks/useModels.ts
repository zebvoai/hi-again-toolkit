import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { AvailableModels } from '@/types';

export const useModels = () => {
  const [models, setModels] = useState<AvailableModels | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const data = await api.getAvailableModels();
        setModels(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  return { models, isLoading, error };
};
