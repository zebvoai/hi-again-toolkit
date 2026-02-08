import type { Message } from '@/types';
import type { AspectRatio } from './components/AspectRatioSelector';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  loadingConversationId: string | null; // Track which conversation is loading
  currentGeneratingModel: string | null; // Track which model is currently generating
  error: string | null;
  selectedModels: string[];
  currentConversationId: string | null;
  selectedProjectId: string | null; // Track selected project for new chats
  selectedAspectRatio: AspectRatio; // Track selected aspect ratio for image mode
  staleConversationIds: Set<string>; // Track conversations that need reloading from DB
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean, conversationId?: string | null) => void;
  setCurrentGeneratingModel: (model: string | null) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  setSelectedModels: (models: string[]) => void;
  setMessages: (messages: Message[]) => void;
  setCurrentConversationId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedAspectRatio: (ratio: AspectRatio) => void;
  markConversationStale: (id: string) => void;
  clearStaleConversation: (id: string) => void;
  isConversationStale: (id: string) => boolean;
  
  // New actions for editing and regeneration
  editMessage: (id: string, newContent: string) => void;
  deleteMessage: (id: string) => void;
  deleteMessagesAfter: (id: string) => void;
  getMessageById: (id: string) => Message | undefined;
  findUserMessageBefore: (assistantMessageId: string) => Message | null;
}
