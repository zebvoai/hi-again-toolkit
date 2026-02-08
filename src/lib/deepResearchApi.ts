import type { Message } from '@/types';

export interface DeepResearchProgress {
  status: 'researching' | 'analyzing' | 'writing' | 'complete';
  phase: 'search' | 'analysis' | 'writing' | 'done';
  progress: number;
  currentModel?: string; // Track which model is currently working
}

export interface DeepResearchResponse {
  content: string;
  model: string;
  synthesized: boolean;
  modelsUsed?: string[];
  wordCount?: number;
  citationsCount?: number;
  error?: string;
}

// Sanitize conversation history for API calls
const sanitizeHistoryForAPI = (history: Message[]): { role: string; content: string }[] => {
  return history.map(msg => {
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

export const deepResearchApi = {
  /**
   * Execute deep research using Perplexity sonar-deep-research
   * Returns comprehensive 6000+ word research with citations
   */
  async executeResearch(
    prompt: string,
    conversationHistory: Message[],
    onProgress?: (progress: DeepResearchProgress) => void,
    signal?: AbortSignal
  ): Promise<DeepResearchResponse> {
    // Start with researching phase
    onProgress?.({
      status: 'researching',
      phase: 'search',
      progress: 0,
    });

    // Simulate progress during the API call (Perplexity deep research can take 30-60+ seconds)
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(progressInterval);
        return;
      }
      
      progressValue += 0.008; // Slower progress for longer research
      
      if (progressValue < 0.35) {
        // First 35%: searching phase (Perplexity)
        onProgress?.({
          status: 'researching',
          phase: 'search',
          progress: progressValue,
          currentModel: 'Perplexity Deep Research',
        });
      } else if (progressValue < 0.65) {
        // 35-65%: analyzing phase (Gemini)
        onProgress?.({
          status: 'analyzing',
          phase: 'analysis',
          progress: progressValue,
          currentModel: 'Gemini 2.5 Pro',
        });
      } else if (progressValue < 0.95) {
        // 65-95%: writing phase (GPT-5)
        onProgress?.({
          status: 'writing',
          phase: 'writing',
          progress: progressValue,
          currentModel: 'GPT-5',
        });
      }
    }, 500);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deep-research`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt,
            conversationHistory: sanitizeHistoryForAPI(conversationHistory),
          }),
          signal,
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific error codes
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (response.status === 402) {
          throw new Error('Insufficient credits. Please check your Perplexity account.');
        }
        
        throw new Error(errorData.error || `Research failed with status ${response.status}`);
      }

      const data = await response.json();

      // Signal completion
      onProgress?.({
        status: 'complete',
        phase: 'done',
        progress: 1,
      });

      return {
        content: data.content,
        model: 'Zebvo Deep Research',
        synthesized: data.synthesized ?? true,
        modelsUsed: data.modelsUsed || ['sonar-deep-research'],
        wordCount: data.wordCount,
        citationsCount: data.citationsCount,
      };
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  },
};

export default deepResearchApi;
