import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types';

export interface ResearchProgress {
  status: 'searching' | 'reading' | 'reasoning' | 'synthesizing' | 'writing' | 'complete';
  sourcesCount?: number;
  currentSource?: string;
  progress?: number;
}

export interface ResearchResponse {
  content: string;
  model: string;
  citations?: Array<{ url: string; title: string; snippet?: string }>;
  sourcesAnalyzed?: number;
}

// Map display names to API model identifiers
const RESEARCH_MODEL_MAP: Record<string, string> = {
  'Sonar Deep Research': 'perplexity/sonar-deep-research',
  'Sonar Pro': 'perplexity/sonar-pro',
  'O3 Deep Research': 'openai/o3',
  'O4 Mini Deep Research': 'openai/o4-mini',
  'DeepSeek Reasoner': 'deepseek/deepseek-reasoner',
  'Gemini 2.5 Pro Research': 'google/gemini-2.5-pro',
};

export const researchApi = {
  /**
   * Start a deep research task with streaming progress updates
   */
  async startResearch(
    prompt: string,
    model: string,
    conversationHistory: Message[],
    onProgress?: (progress: ResearchProgress) => void,
    signal?: AbortSignal
  ): Promise<ResearchResponse> {
    // Map display name to API ID
    const apiModelId = RESEARCH_MODEL_MAP[model] || 'perplexity/sonar-deep-research';
    
    // Simulate progress updates for UX (research functions return all at once)
    const progressInterval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(progressInterval);
        return;
      }
      
      // Cycle through statuses to show activity
      const statuses: ResearchProgress['status'][] = ['searching', 'reading', 'reasoning', 'synthesizing'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const sourcesCount = Math.floor(Math.random() * 10) + 5;
      
      onProgress?.({
        status: randomStatus,
        sourcesCount,
        progress: Math.random() * 0.8,
      });
    }, 3000);
    
    try {
      // Make the actual API call
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt,
          model: apiModelId,
          conversationHistory: conversationHistory.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          })),
        }),
        signal,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Research failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Signal completion
      onProgress?.({
        status: 'complete',
        sourcesCount: data.sourcesAnalyzed || 0,
        progress: 1,
      });
      
      return {
        content: data.content,
        model: data.model || model,
        citations: data.citations,
        sourcesAnalyzed: data.sourcesAnalyzed,
      };
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  },
};

export default researchApi;
