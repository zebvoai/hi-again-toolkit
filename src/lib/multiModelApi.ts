import type { Mode, Message, MultiModelChatResponse, MultiModelContent } from '@/types';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Sanitize conversation history for API calls - converts multi-model object content to string
const sanitizeHistoryForAPI = (history: Message[]): { role: string; content: string }[] => {
  return history.map(msg => {
    let content: string;
    
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (typeof msg.content === 'object' && msg.content !== null && !Array.isArray(msg.content)) {
      // Multi-model response object - extract first model's response
      const values = Object.values(msg.content);
      content = typeof values[0] === 'string' ? values[0] : '';
    } else {
      content = '';
    }
    
    return { role: msg.role, content };
  });
};

export const multiModelApi = {
  async sendMessageMultiModel(
    message: string,
    mode: Mode,
    history: Message[],
    models: string[],
    onProgress?: (modelName: string, chunk: string) => void,
    signal?: AbortSignal
  ): Promise<MultiModelChatResponse> {
    // Send request to backend with multiple models
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
        models, // Array of models
        stream: !!onProgress
      }),
      signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    // Handle streaming response for multiple models
    if (onProgress && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const fullContents: MultiModelContent = {};
      
      models.forEach(model => {
        fullContents[model] = '';
      });

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
                if (parsed.model && parsed.content) {
                  fullContents[parsed.model] += parsed.content;
                  onProgress(parsed.model, parsed.content);
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
        content: fullContents,
        models
      };
    }

    // Non-streaming response
    return response.json();
  }
};
