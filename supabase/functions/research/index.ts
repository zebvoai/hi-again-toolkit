import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Research model configurations
const RESEARCH_MODELS: Record<string, { 
  provider: 'perplexity' | 'openai' | 'deepseek' | 'lovable';
  endpoint: string;
  envKey: string;
}> = {
  'perplexity/sonar-deep-research': {
    provider: 'perplexity',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    envKey: 'PERPLEXITY_API_KEY',
  },
  'perplexity/sonar-pro': {
    provider: 'perplexity',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    envKey: 'PERPLEXITY_API_KEY',
  },
  'openai/o3': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    envKey: 'OPENAI_API_KEY',
  },
  'openai/o4-mini': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    envKey: 'OPENAI_API_KEY',
  },
  // OpenRouter-hosted DeepSeek models
  'deepseek/deepseek-r1': {
    provider: 'deepseek',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'OPENROUTER_API_KEY',
  },
  // Backwards-compat alias (older UI mapping)
  'deepseek/deepseek-reasoner': {
    provider: 'deepseek',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    envKey: 'OPENROUTER_API_KEY',
  },
  'google/gemini-2.5-pro': {
    provider: 'lovable',
    endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    envKey: 'LOVABLE_API_KEY',
  },
};

const RESEARCH_SYSTEM_PROMPT = `You are a deep research assistant specialized in comprehensive, multi-source analysis. Your task is to:

1. Thoroughly analyze the user's research question
2. Search across multiple authoritative sources
3. Synthesize findings into a well-structured, detailed response
4. Provide citations and references where applicable
5. Present information in clear sections with headings

Your response should be:
- Comprehensive (thousands of words if needed)
- Well-structured with clear headings and sections
- Include citations in [Source Title](URL) format when available
- Provide balanced perspectives on complex topics
- Highlight key findings and conclusions

Take your time to provide thorough, high-quality research.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model, conversationHistory = [] } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[Research] Starting research with model: ${model}`);
    console.log(`[Research] Prompt: ${prompt.substring(0, 100)}...`);
    
    // Get model configuration, default to Perplexity Sonar
    const modelConfig = RESEARCH_MODELS[model] || RESEARCH_MODELS['perplexity/sonar-pro'];
    const apiKey = Deno.env.get(modelConfig.envKey);
    
    if (!apiKey) {
      console.error(`[Research] Missing API key for ${modelConfig.envKey}`);
      // Fall back to Lovable AI if the specific key is missing
      const lovableKey = Deno.env.get('LOVABLE_API_KEY');
      if (!lovableKey) {
        return new Response(
          JSON.stringify({ error: 'No API key configured for research' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Use Lovable AI as fallback
      console.log('[Research] Falling back to Lovable AI');
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
            ...conversationHistory.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: prompt },
          ],
          max_tokens: 16000,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Research] Lovable AI error:', errorText);
        
        // Parse error to provide specific feedback
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.type === 'payment_required' || response.status === 402) {
            return new Response(
              JSON.stringify({ error: 'Not enough Lovable AI credits. Please add credits in Settings → Workspace → Usage.' }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          if (response.status === 429) {
            return new Response(
              JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch {
          // Not JSON, continue with generic error
        }
        
        return new Response(
          JSON.stringify({ error: 'Research request failed. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      return new Response(
        JSON.stringify({
          content,
          model: 'Gemini 2.5 Pro Research',
          sourcesAnalyzed: 0,
          citations: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Build request based on provider
    let requestBody: Record<string, unknown>;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    switch (modelConfig.provider) {
      case 'perplexity':
        headers['Authorization'] = `Bearer ${apiKey}`;
        requestBody = {
          model: model.replace('perplexity/', ''),
          messages: [
            { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
            ...conversationHistory,
            { role: 'user', content: prompt },
          ],
          max_tokens: 16000,
          return_citations: true,
          search_recency_filter: 'month',
        };
        break;
        
      case 'openai':
        headers['Authorization'] = `Bearer ${apiKey}`;
        const openaiModel = model === 'openai/o3' ? 'o3' : 'o4-mini';
        requestBody = {
          model: openaiModel,
          messages: [
            { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
            ...conversationHistory,
            { role: 'user', content: prompt },
          ],
          max_completion_tokens: 16000,
        };
        break;
        
      case 'deepseek': {
        headers['Authorization'] = `Bearer ${apiKey}`;

        // UI previously sent deepseek/deepseek-reasoner, but OpenRouter expects deepseek/deepseek-r1 (and other valid IDs)
        const resolvedDeepseekModel = model === 'deepseek/deepseek-reasoner' ? 'deepseek/deepseek-r1' : model;

        requestBody = {
          model: resolvedDeepseekModel,
          messages: [
            { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
            ...conversationHistory,
            { role: 'user', content: prompt },
          ],
          max_tokens: 16000,
        };
        break;
      }
        
      case 'lovable':
      default:
        headers['Authorization'] = `Bearer ${apiKey}`;
        requestBody = {
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
            ...conversationHistory,
            { role: 'user', content: prompt },
          ],
          max_tokens: 16000,
        };
        break;
    }
    
    console.log(`[Research] Calling ${modelConfig.provider} API...`);
    
    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Research] API error (${response.status}):`, errorText);

      let errorMessage = 'Research request failed';
      try {
        const parsed = JSON.parse(errorText);
        errorMessage = parsed?.error?.message || parsed?.error || parsed?.message || errorMessage;
      } catch {
        // keep fallback message
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please check your API credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Preserve upstream status for actionable client errors (e.g. invalid model id)
      const status = response.status >= 400 && response.status < 500 ? response.status : 500;
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = await response.json();
    console.log('[Research] Response received successfully');
    
    // Extract content and citations based on provider
    let content = data.choices?.[0]?.message?.content || '';
    let citations: { url: string; title: string; snippet?: string }[] = [];
    
    // Perplexity returns citations in the response
    if (modelConfig.provider === 'perplexity' && data.citations) {
      citations = data.citations.map((c: { url: string; title?: string; snippet?: string }, index: number) => ({
        url: c.url || '',
        title: c.title || `Source ${index + 1}`,
        snippet: c.snippet,
      }));
    }
    
    return new Response(
      JSON.stringify({
        content,
        model: model.split('/').pop() || model,
        sourcesAnalyzed: citations.length || 0,
        citations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Research] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
