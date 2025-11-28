export type InteractionMode = 'text' | 'image' | 'video' | 'build';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode: InteractionMode;
}

export interface ChatState {
  messages: Message[];
  currentMode: InteractionMode;
  isStreaming: boolean;
  error: string | null;
}
