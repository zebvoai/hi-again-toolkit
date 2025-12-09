import { create } from 'zustand';
import type { ChatState } from '../types';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  selectedModels: ['Zebvo AI'], // Zebvo AI is always selected by default
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
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  
  // New actions for editing and regeneration
  editMessage: (id, newContent) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.id === id ? { ...msg, content: newContent } : msg
    )
  })),
  
  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter(msg => msg.id !== id)
  })),
  
  deleteMessagesAfter: (id) => {
    const messages = get().messages;
    const index = messages.findIndex(msg => msg.id === id);
    if (index === -1) return;
    set({ messages: messages.slice(0, index + 1) });
  },
  
  getMessageById: (id) => {
    return get().messages.find(msg => msg.id === id);
  },
  
  findUserMessageBefore: (assistantMessageId) => {
    const messages = get().messages;
    const index = messages.findIndex(msg => msg.id === assistantMessageId);
    if (index <= 0) return null;
    
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user' && typeof messages[i].content === 'string') {
        return messages[i];
      }
    }
    return null;
  }
}));
