import type { Mode, Message, MultiModelChatResponse, MultiModelContent } from '@/types';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Maximum recent messages to send as context
const MAX_HISTORY_MESSAGES = 20;

// Sanitize & truncate conversation history for API calls
const sanitizeHistoryForAPI = (history: Message[]): { role: string; content: string }[] => {
  const recent = history.slice(-MAX_HISTORY_MESSAGES);

  return recent.map(msg => {
    let content: string;

    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (typeof msg.content === 'object' && msg.content !== null && !Array.isArray(msg.content)) {
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
    signal?: AbortSignal,
    attachments?: string[],
    onActivity?: (activity: 'searching_web' | 'analyzing_image' | 'analyzing_pdf' | 'generating') => void
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
        stream: !!onProgress,
        attachments
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
      
      // Batch update tracking — throttle zustand updates to reduce re-renders
      let pendingUpdate = false;
      const BATCH_INTERVAL = 50; // ms between UI updates
      
      models.forEach(model => {
        fullContents[model] = '';
      });

      const flushUpdate = () => {
        // Notify with empty chunk to trigger a batched re-render
        // The actual content is tracked in fullContents
        pendingUpdate = false;
      };

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
                // Handle activity events from backend
                if (parsed.activity && onActivity) {
                  onActivity(parsed.activity);
                }
                // Handle content chunks — accumulate and batch UI updates
                else if (parsed.model && parsed.content) {
                  fullContents[parsed.model] += parsed.content;
                  
                  if (!pendingUpdate) {
                    pendingUpdate = true;
                    // Use setTimeout to batch multiple chunks arriving within the interval
                    setTimeout(() => {
                      onProgress(parsed.model, ''); // Signal update
                      flushUpdate();
                    }, BATCH_INTERVAL);
                  }
                  // Always call onProgress so the caller accumulates content correctly
                  onProgress(parsed.model, parsed.content);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error: any) {
        if (signal?.aborted) {
          throw new DOMException('The user aborted a request.', 'AbortError');
        }
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
