import { create } from 'zustand';
import type { ChatState } from '../types';
import type { Message } from '@/types';

/**
 * LRU message cache — keeps the last N conversations' messages in memory.
 * When the user switches chats we stash the current messages and restore
 * from cache when they come back, avoiding a network round-trip.
 */
const MAX_CACHED_CONVERSATIONS = 5;

interface CacheEntry {
  messages: Message[];
  accessedAt: number;
}

const messageCache = new Map<string, CacheEntry>();

function cacheMessages(conversationId: string, messages: Message[]) {
  messageCache.set(conversationId, { messages, accessedAt: Date.now() });

  // Evict oldest if over limit
  if (messageCache.size > MAX_CACHED_CONVERSATIONS) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, entry] of messageCache) {
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) messageCache.delete(oldestKey);
  }
}

function getCachedMessages(conversationId: string): Message[] | null {
  const entry = messageCache.get(conversationId);
  if (!entry) return null;
  entry.accessedAt = Date.now();
  return entry.messages;
}

function evictFromCache(conversationId: string) {
  messageCache.delete(conversationId);
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  loadingConversationId: null,
  currentGeneratingModel: null, // Track which model is currently generating
  error: null,
  selectedModels: [],
  currentConversationId: null,
  selectedProjectId: null,
  selectedAspectRatio: '1:1',
  staleConversationIds: new Set<string>(),

  markConversationStale: (id: string) => set((state) => {
    const next = new Set(state.staleConversationIds);
    next.add(id);
    return { staleConversationIds: next };
  }),

  clearStaleConversation: (id: string) => set((state) => {
    const next = new Set(state.staleConversationIds);
    next.delete(id);
    return { staleConversationIds: next };
  }),

  isConversationStale: (id: string) => get().staleConversationIds.has(id),

  addMessage: (message) => set((state) => {
    // Fast duplicate check — only compare by ID (the most reliable key)
    if (state.messages.some(m => m.id === message.id)) {
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
    loadingConversationId: loading ? (conversationId ?? state.currentConversationId) : null,
    currentGeneratingModel: loading ? state.currentGeneratingModel : null, // Clear model when done
  })),

  setCurrentGeneratingModel: (model) => set({ currentGeneratingModel: model }),

  setError: (error) => set({ error }),

  clearMessages: () => {
    // Stash current messages into cache before clearing
    const { currentConversationId, messages } = get();
    if (currentConversationId && messages.length > 0) {
      cacheMessages(currentConversationId, messages);
    }
    set({ messages: [] });
  },

  setSelectedModels: (models) => set({ selectedModels: models }),

  setMessages: (messages) => {
    // Also update the cache for the current conversation
    const { currentConversationId } = get();
    if (currentConversationId && messages.length > 0) {
      cacheMessages(currentConversationId, messages);
    }
    set({ messages });
  },

  setCurrentConversationId: (id) => {
    const prev = get().currentConversationId;
    const prevMessages = get().messages;

    // Stash previous conversation's messages
    if (prev && prevMessages.length > 0) {
      cacheMessages(prev, prevMessages);
    }

    // Try to restore from cache for the new conversation
    if (id) {
      const cached = getCachedMessages(id);
      if (cached) {
        set({ currentConversationId: id, messages: cached });
        return;
      }
    }

    // No cache — clear messages, they'll be loaded by the caller
    set({ currentConversationId: id, messages: id ? get().messages : [] });
  },

  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedAspectRatio: (ratio) => set({ selectedAspectRatio: ratio }),

  // Editing and regeneration actions
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

// Expose cache utilities for external use (e.g. delete conversation)
export { evictFromCache };
