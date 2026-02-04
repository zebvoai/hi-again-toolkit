import { create } from 'zustand';
import type { ChatState } from '../types';

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  loadingConversationId: null,
  error: null,
  selectedModels: [], // Will be initialized to all models on first load
  currentConversationId: null,
  addMessage: (message) => set((state) => {
    // Prevent adding duplicate messages by checking ID and content
    const exists = state.messages.some(m => 
      m.id === message.id || 
      (m.role === message.role && 
       JSON.stringify(m.content) === JSON.stringify(message.content) &&
       Math.abs((m.timestamp || 0) - (message.timestamp || 0)) < 10000)
    );
    if (exists) {
      console.log('Skipping duplicate message in store:', message.id);
      return state;
    }
    return { messages: [...state.messages, message] };
  }),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),
  setLoading: (loading, conversationId) => set((state) => ({ 
    isLoading: loading,
    loadingConversationId: loading ? (conversationId ?? state.currentConversationId) : null
  })),
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
