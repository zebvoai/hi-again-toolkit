export type Mode = 'text' | 'image' | 'video' | 'build';
export type Provider = 'openai' | 'anthropic' | 'google' | 'stability' | 'runway' | 'pika';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    provider?: string;
    imageUrl?: string;
    error?: string;
  };
}

export interface ChatRequest {
  message: string;
  mode: Mode;
  conversationHistory: Message[];
  provider?: Provider;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface ImageRequest {
  prompt: string;
  provider?: Provider;
}

export interface ImageResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

export interface AvailableModels {
  text: string[];
  image: string[];
  video: string[];
  build: string[];
}
