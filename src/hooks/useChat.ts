import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { Message, InteractionMode } from '@/types';
import { streamChatCompletion } from '@/lib/api';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<InteractionMode>('text');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: nanoid(),
      role,
      content,
      timestamp: new Date(),
      mode: currentMode,
    };
    setMessages(prev => [...prev, message]);
    return message.id;
  }, [currentMode]);

  const updateLastMessage = useCallback((content: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content,
        };
      }
      return newMessages;
    });
  }, []);

  const sendMessage = useCallback(async (userMessage: string) => {
    try {
      setError(null);
      addMessage('user', userMessage);

      const systemPrompt = getSystemPrompt(currentMode);
      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMessage },
      ];

      let assistantContent = '';
      addMessage('assistant', '');
      setIsStreaming(true);

      await streamChatCompletion({
        messages: chatMessages,
        mode: currentMode,
        onDelta: (chunk) => {
          assistantContent += chunk;
          updateLastMessage(assistantContent);
        },
        onDone: () => {
          setIsStreaming(false);
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setIsStreaming(false);
        },
      });
    } catch (err) {
      console.error('Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsStreaming(false);
    }
  }, [addMessage, updateLastMessage, currentMode, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const changeMode = useCallback((mode: InteractionMode) => {
    setCurrentMode(mode);
    setError(null);
  }, []);

  return {
    messages,
    currentMode,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    changeMode,
  };
}

function getSystemPrompt(mode: InteractionMode): string {
  const prompts: Record<InteractionMode, string> = {
    text: 'You are a helpful AI assistant. Provide clear, concise, and accurate responses.',
    image: 'You are an AI assistant specialized in image analysis and generation. Help users understand and create visual content.',
    video: 'You are an AI assistant specialized in video content. Help users with video-related tasks and queries.',
    build: 'You are an AI coding assistant. Help users write, debug, and optimize code. Provide clear explanations and working examples.',
  };
  return prompts[mode];
}
