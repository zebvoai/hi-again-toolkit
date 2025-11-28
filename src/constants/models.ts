import { ModelConfig } from '@/types/model.types';

export const MODELS: ModelConfig[] = [
  // OpenAI Models
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    supportedModes: ['normal', 'build'],
    maxTokens: 128000,
    supportsStreaming: true,
    costPer1kTokens: 0.01,
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    supportedModes: ['normal', 'build'],
    maxTokens: 8192,
    supportsStreaming: true,
    costPer1kTokens: 0.03,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    supportedModes: ['normal'],
    maxTokens: 16385,
    supportsStreaming: true,
    costPer1kTokens: 0.0015,
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    supportedModes: ['image'],
    maxTokens: 4000,
    supportsStreaming: false,
    costPer1kTokens: 0.04,
  },

  // Anthropic Models
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    supportedModes: ['normal', 'build'],
    maxTokens: 200000,
    supportsStreaming: true,
    costPer1kTokens: 0.015,
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    supportedModes: ['normal', 'build'],
    maxTokens: 200000,
    supportsStreaming: true,
    costPer1kTokens: 0.003,
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    supportedModes: ['normal'],
    maxTokens: 200000,
    supportsStreaming: true,
    costPer1kTokens: 0.00025,
  },

  // Google Models
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    supportedModes: ['normal', 'build'],
    maxTokens: 30720,
    supportsStreaming: true,
    costPer1kTokens: 0.00025,
  },
  {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    provider: 'google',
    supportedModes: ['image'],
    maxTokens: 30720,
    supportsStreaming: true,
    costPer1kTokens: 0.00025,
  },
];

export const DEFAULT_MODELS_BY_MODE = {
  normal: 'gpt-4-turbo',
  image: 'dall-e-3',
  video: 'gpt-4-turbo', // Placeholder for video models
  build: 'claude-3-sonnet',
};

export const MODE_DESCRIPTIONS = {
  normal: 'Standard conversational AI for general questions and tasks',
  image: 'Generate and analyze images with AI',
  video: 'Process and generate video content',
  build: 'Generate code and build applications',
};
