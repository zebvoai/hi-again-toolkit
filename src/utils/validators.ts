import { AIProvider } from '@/types/model.types';

export const validateApiKey = (provider: AIProvider, apiKey: string): boolean => {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    case 'anthropic':
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    case 'google':
      return apiKey.length > 20;
    default:
      return false;
  }
};

export const validateMessage = (message: string): { valid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (message.length > 4000) {
    return { valid: false, error: 'Message exceeds 4000 character limit' };
  }

  return { valid: true };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const estimateTokenCount = (text: string): number => {
  return Math.ceil(text.length / 4);
};
