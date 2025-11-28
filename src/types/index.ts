export type Mode = 'text' | 'image' | 'video' | 'build';
export type Provider = 'openai' | 'anthropic' | 'google' | 'stability' | 'runway' | 'pika';

export interface MultiModelContent {
  [modelName: string]: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | MultiModelContent;
  timestamp: number;
  metadata?: {
    model?: string;
    models?: string[];
    provider?: string;
    imageUrl?: string;
    videoUrl?: string;
    error?: string;
    isImage?: boolean;
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

export interface MultiModelChatResponse {
  content: MultiModelContent;
  models: string[];
}

export interface ImageRequest {
  prompt: string;
  provider?: Provider;
}

export interface ImageResponse {
  imageUrl: string;
  revisedPrompt?: string;
  model?: string;
}

export interface AvailableModels {
  text: string[];
  image: string[];
  video: string[];
  build: string[];
}
