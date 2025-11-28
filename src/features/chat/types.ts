import type { Message } from '@/types';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  selectedModels: string[];
  isModelLocked: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  setSelectedModels: (models: string[]) => void;
  lockModels: () => void;
  unlockModels: () => void;
}
