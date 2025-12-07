import type { Message } from '@/types';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  selectedModels: string[];
  currentConversationId: string | null;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  setSelectedModels: (models: string[]) => void;
  setMessages: (messages: Message[]) => void;
  setCurrentConversationId: (id: string | null) => void;
  
  // New actions for editing and regeneration
  editMessage: (id: string, newContent: string) => void;
  deleteMessage: (id: string) => void;
  deleteMessagesAfter: (id: string) => void;
  getMessageById: (id: string) => Message | undefined;
  findUserMessageBefore: (assistantMessageId: string) => Message | null;
}
