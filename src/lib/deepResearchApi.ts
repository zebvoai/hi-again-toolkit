import type { Message } from '@/types';

export interface DeepResearchProgress {
  status: 'researching' | 'synthesizing' | 'complete';
  phase: 'parallel' | 'synthesis' | 'done';
  progress: number;
}

export interface DeepResearchResponse {
  content: string;
  model: string;
  synthesized: boolean;
  modelsUsed?: string[];
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
   * Execute deep research with the fixed 3-model pipeline:
   * 1. Parallel research: Claude Opus 4.5 + Gemini 3 Pro
   * 2. Synthesis: GPT-5
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
      phase: 'parallel',
      progress: 0,
    });

    // Simulate progress during the API call
    let progressValue = 0;
    const progressInterval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(progressInterval);
        return;
      }
      
      progressValue += 0.02;
      
      if (progressValue < 0.6) {
        // First 60%: researching phase
        onProgress?.({
          status: 'researching',
          phase: 'parallel',
          progress: progressValue,
        });
      } else if (progressValue < 0.95) {
        // 60-95%: synthesis phase
        onProgress?.({
          status: 'synthesizing',
          phase: 'synthesis',
          progress: progressValue,
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
          throw new Error('Insufficient credits. Please add more credits to continue.');
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
        model: data.model || 'Deep Research',
        synthesized: data.synthesized ?? true,
        modelsUsed: data.modelsUsed,
      };
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  },
};

export default deepResearchApi;
