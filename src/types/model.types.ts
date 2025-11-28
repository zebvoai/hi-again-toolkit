import { InteractionMode } from './chat.types';

export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  supportedModes: InteractionMode[];
  maxTokens: number;
  supportsStreaming: boolean;
  costPer1kTokens: number;
}

export interface ProviderCredentials {
  openai?: string;
  anthropic?: string;
  google?: string;
}

export interface ModelSelection {
  provider: AIProvider;
  modelId: string;
  mode: InteractionMode;
}
