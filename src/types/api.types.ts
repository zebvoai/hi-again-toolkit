export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface StreamCallback {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: ApiError) => void;
}

export interface ChatCompletionRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
  model: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  model: string;
  size?: string;
  quality?: string;
}

export interface ImageGenerationResponse {
  url: string;
  revisedPrompt?: string;
}
