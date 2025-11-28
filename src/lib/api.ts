import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  mode: 'text' | 'image' | 'video' | 'build';
}

export async function streamChatCompletion({
  messages,
  mode,
  onDelta,
  onDone,
  onError,
}: ChatRequest & {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, mode }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => null);
      throw new Error(errorData?.error || `Request failed: ${resp.status}`);
    }

    if (!resp.body) {
      throw new Error('No response body');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onDelta(content);
          }
        } catch {
          // Incomplete JSON, continue buffering
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    onDone();
  } catch (error) {
    console.error('Stream error:', error);
    onError(error instanceof Error ? error.message : 'Failed to connect to AI service');
  }
}
