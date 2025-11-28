export type MessageRole = 'user' | 'assistant' | 'system';

export type InteractionMode = 'normal' | 'image' | 'video' | 'build';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  model?: string;
  imageUrl?: string;
  videoUrl?: string;
  codeBlocks?: CodeBlock[];
  error?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: InteractionMode;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}
