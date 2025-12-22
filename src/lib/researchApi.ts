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
    
    // Sequential progress simulation with realistic timing
    const progressStages: { status: ResearchProgress['status']; duration: number; sourcesRange: [number, number] }[] = [
      { status: 'searching', duration: 6000, sourcesRange: [3, 8] },
      { status: 'reading', duration: 8000, sourcesRange: [8, 15] },
      { status: 'reasoning', duration: 7000, sourcesRange: [15, 20] },
      { status: 'synthesizing', duration: 5000, sourcesRange: [20, 25] },
      { status: 'writing', duration: 4000, sourcesRange: [25, 30] },
    ];
    
    let currentStageIndex = 0;
    let currentSources = 0;
    let stageStartTime = Date.now();
    
    const progressInterval = setInterval(() => {
      if (signal?.aborted) {
        clearInterval(progressInterval);
        return;
      }
      
      const currentStage = progressStages[currentStageIndex];
      if (!currentStage) {
        clearInterval(progressInterval);
        return;
      }
      
      const elapsed = Date.now() - stageStartTime;
      const stageProgress = Math.min(elapsed / currentStage.duration, 1);
      
      // Gradually increment sources within the stage's range
      const [minSources, maxSources] = currentStage.sourcesRange;
      const targetSources = Math.floor(minSources + (maxSources - minSources) * stageProgress);
      if (targetSources > currentSources) {
        currentSources = targetSources;
      }
      
      // Calculate overall progress
      const overallProgress = (currentStageIndex + stageProgress) / progressStages.length;
      
      onProgress?.({
        status: currentStage.status,
        sourcesCount: currentSources,
        progress: overallProgress,
      });
      
      // Move to next stage when current is complete
      if (elapsed >= currentStage.duration && currentStageIndex < progressStages.length - 1) {
        currentStageIndex++;
        stageStartTime = Date.now();
      }
    }, 500);
    
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
        sourcesCount: data.sourcesAnalyzed || currentSources,
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
