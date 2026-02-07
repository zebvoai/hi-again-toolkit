export type Mode = 'text' | 'image' | 'video' | 'build' | 'research';
export type Provider = 'openai' | 'anthropic' | 'google';

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
    aspectRatio?: string;
    videoUrl?: string;
    error?: string;
    isImage?: boolean;
    isImageToImage?: boolean;
    attachments?: string[];
    prompt?: string; // Original prompt for image/video generation
    // Deep Research specific metadata
    researchStatus?: 'searching' | 'reading' | 'reasoning' | 'synthesizing' | 'writing' | 'complete';
    sourcesCount?: number;
    citations?: Array<{ url: string; title: string; snippet?: string }>;
    isResearch?: boolean;
    // Generation status tracking for persistence across refresh/navigation
    generationStatus?: 'generating' | 'interrupted' | 'complete';
    generationMode?: string; // Which mode was used (text, image, video, research)
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
  research: string[];
}
