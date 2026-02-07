import type { Mode, Provider, Message, ChatResponse, ImageResponse, AvailableModels } from '@/types';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Maximum number of recent messages to send as context to the API
// Keeps payloads lean while preserving enough conversational context
const MAX_HISTORY_MESSAGES = 20;

// Sanitize & truncate conversation history for API calls
const sanitizeHistoryForAPI = (history: Message[]): { role: string; content: string }[] => {
  // Take only the last N messages to keep the payload small
  const recent = history.slice(-MAX_HISTORY_MESSAGES);

  return recent.map(msg => {
    let content: string;

    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (typeof msg.content === 'object' && msg.content !== null && !Array.isArray(msg.content)) {
      // Multi-model response object — extract first model's response
      const values = Object.values(msg.content);
      content = typeof values[0] === 'string' ? values[0] : '';
    } else {
      content = '';
    }

    return { role: msg.role, content };
  });
};

export const api = {
  async sendMessage(
    message: string,
    mode: Mode,
    history: Message[],
    provider?: Provider,
    model?: string,
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal,
    attachments?: string[]
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({
        message,
        mode,
        conversationHistory: sanitizeHistoryForAPI(history),
        provider,
        model,
        stream: !!onChunk,
        attachments
      }),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    // Handle streaming response
    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let responseModel = '';
      let responseProvider = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  responseModel = parsed.model || responseModel;
                  responseProvider = parsed.provider || responseProvider;
                  onChunk(parsed.content);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        throw new Error('Streaming failed');
      }
      
      return {
        content: fullContent,
        model: responseModel,
        provider: responseProvider
      };
    }
    
    return response.json();
  },
  
  async generateImage(prompt: string, provider?: Provider, model?: string, signal?: AbortSignal, sourceImage?: string, width?: number, height?: number, size?: string, aspectRatio?: string): Promise<ImageResponse> {
    const response = await fetch(`${API_BASE}/image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ prompt, provider, model, sourceImage, width, height, size, aspectRatio }),
      signal
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Image generation failed');
    }
    
    return response.json();
  },

  async generateVideo(prompt: string, provider?: Provider, model?: string, signal?: AbortSignal): Promise<{ videoUrl: string; model?: string }> {
    const response = await fetch(`${API_BASE}/video`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ prompt, provider, model }),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Video generation failed');
    }
    
    return response.json();
  },
  
  async getAvailableModels(): Promise<AvailableModels> {
    const response = await fetch(`${API_BASE}/models`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      }
    });
    return response.json();
  }
};
