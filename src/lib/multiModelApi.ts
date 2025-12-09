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

export interface ZebvoAIConfirmation {
  requiresConfirmation: boolean;
  content: string;
  intent?: {
    intent: string;
    confidence: number;
    suggestedModel: string;
    reasoning: string;
  };
}

export const multiModelApi = {
  async sendMessageMultiModel(
    message: string,
    mode: Mode,
    history: Message[],
    models: string[],
    onProgress?: (modelName: string, chunk: string) => void,
    signal?: AbortSignal,
    attachments?: string[],
    confirmDeepResearch?: boolean
  ): Promise<MultiModelChatResponse | ZebvoAIConfirmation> {
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
        stream: !!onProgress,
        attachments,
        confirmDeepResearch
      }),
      signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    // Check if this is a non-streaming JSON response (like confirmation)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      // Check if this is a Zebvo AI confirmation request
      if (data.requiresConfirmation) {
        return data as ZebvoAIConfirmation;
      }
      return data;
    }

    // Handle streaming response for multiple models
    if (onProgress && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const fullContents: MultiModelContent = {};
      const actualModels: string[] = [];
      
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
                  // Handle Zebvo AI routing info (shows as "Zebvo AI → ModelName")
                  const modelKey = parsed.model;
                  if (!fullContents[modelKey]) {
                    fullContents[modelKey] = '';
                    if (!actualModels.includes(modelKey)) {
                      actualModels.push(modelKey);
                    }
                  }
                  fullContents[modelKey] += parsed.content;
                  onProgress(modelKey, parsed.content);
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

      // Use actual models from response if different from requested
      const finalModels = actualModels.length > 0 ? actualModels : models;

      return {
        content: fullContents,
        models: finalModels
      };
    }

    // Non-streaming response
    return response.json();
  }
};
