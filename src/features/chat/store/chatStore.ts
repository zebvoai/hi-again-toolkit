import { create } from 'zustand';
import type { ChatState } from '../types';

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,
  selectedModels: [],
  currentConversationId: null,
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
  clearMessages: () => set({ messages: [] }),
  setSelectedModels: (models) => set({ selectedModels: models }),
  setMessages: (messages) => set({ messages }),
  setCurrentConversationId: (id) => set({ currentConversationId: id })
}));
