import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { ChatMessage, InteractionMode } from '@/types/chat.types';
import { ModelSelection } from '@/types/model.types';
import { nanoid } from 'nanoid';

interface ChatState {
  messages: ChatMessage[];
  currentMode: InteractionMode;
  currentModel: ModelSelection | null;
  isStreaming: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: string }
  | { type: 'SET_MODE'; payload: InteractionMode }
  | { type: 'SET_MODEL'; payload: ModelSelection }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'CLEAR_ERROR' };

interface ChatContextValue extends ChatState {
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  updateLastMessage: (content: string) => void;
  setMode: (mode: InteractionMode) => void;
  setModel: (model: ModelSelection) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const initialState: ChatState = {
  messages: [],
  currentMode: 'normal',
  currentModel: null,
  isStreaming: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'UPDATE_LAST_MESSAGE':
      if (state.messages.length === 0) return state;
      const updatedMessages = [...state.messages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: action.payload,
      };
      return {
        ...state,
        messages: updatedMessages,
      };

    case 'SET_MODE':
      return {
        ...state,
        currentMode: action.payload,
      };

    case 'SET_MODEL':
      return {
        ...state,
        currentModel: action.payload,
      };

    case 'SET_STREAMING':
      return {
        ...state,
        isStreaming: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: ChatMessage = {
      id: nanoid(),
      role,
      content,
      timestamp: new Date(),
      model: state.currentModel?.modelId,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, [state.currentModel]);

  const updateLastMessage = useCallback((content: string) => {
    dispatch({ type: 'UPDATE_LAST_MESSAGE', payload: content });
  }, []);

  const setMode = useCallback((mode: InteractionMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setModel = useCallback((model: ModelSelection) => {
    dispatch({ type: 'SET_MODEL', payload: model });
  }, []);

  const setStreaming = useCallback((isStreaming: boolean) => {
    dispatch({ type: 'SET_STREAMING', payload: isStreaming });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: ChatContextValue = {
    ...state,
    addMessage,
    updateLastMessage,
    setMode,
    setModel,
    setStreaming,
    setError,
    clearMessages,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
