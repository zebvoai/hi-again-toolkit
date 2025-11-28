import type { Mode, Provider, Message, ChatResponse, ImageResponse, AvailableModels } from '@/types';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const api = {
  async sendMessage(
    message: string,
    mode: Mode,
    history: Message[],
    provider?: Provider,
    model?: string,
    onChunk?: (chunk: string) => void,
    signal?: AbortSignal
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
        conversationHistory: history,
        provider,
        model,
        stream: !!onChunk
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
  
  async generateImage(prompt: string, provider?: Provider, model?: string, signal?: AbortSignal): Promise<ImageResponse> {
    const response = await fetch(`${API_BASE}/image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ prompt, provider, model }),
      signal
    });
    
    if (!response.ok) {
      throw new Error('Image generation failed');
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
