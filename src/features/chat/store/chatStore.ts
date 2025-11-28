import { create } from 'zustand';
import type { ChatState } from '../types';

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  selectedModels: [],
  isModelLocked: false,
  currentConversationId: null,
  isTemporaryMode: false,
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [], isModelLocked: false }),
  setSelectedModels: (models) => set({ selectedModels: models }),
  lockModels: () => set({ isModelLocked: true }),
  unlockModels: () => set({ isModelLocked: false }),
  setMessages: (messages) => set({ messages }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setTemporaryMode: (isTemporary) => set({ isTemporaryMode: isTemporary })
}));
