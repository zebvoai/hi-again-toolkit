import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Message {
  role: string;
  content: string;
}

// Fixed model configuration for Deep Research
const RESEARCH_MODELS = {
  claude: {
    displayName: 'Claude Opus 4.5',
    apiModel: 'anthropic/claude-opus-4.5',
    provider: 'openrouter',
  },
  gemini: {
    displayName: 'Gemini 3 Pro',
    apiModel: 'google/gemini-3-pro-preview',
    provider: 'lovable',
  },
  gpt5: {
    displayName: 'GPT-5',
    apiModel: 'openai/gpt-5',
    provider: 'openrouter',
  },
};

// Research prompt for Claude and Gemini - focuses on deep analysis
const RESEARCH_PROMPT = `You are a deep research analyst. Your task is to thoroughly analyze the user's question.

Focus on:
- Accuracy and factual correctness
- Edge cases and nuances
- Unique insights and perspectives
- Supporting evidence and reasoning

Guidelines:
- Be thorough and comprehensive
- Focus on substance, not filler
- Highlight uncertainties or areas of debate
- Do NOT format as a final answer - you're providing research notes
- Do NOT add conversational intros or conclusions
- Just provide your analysis directly

Your research will be synthesized with another model's findings.`;

// Synthesis prompt for GPT-5 - merges research outputs
const SYNTHESIS_PROMPT = `You are synthesizing research from multiple AI analysts into a single, high-quality answer.

You will receive research from two sources. Your job is to:
1. Merge their insights into a unified, coherent response
2. Resolve any contradictions thoughtfully
3. Remove redundancy while preserving unique insights
4. Maintain a natural, conversational tone (not academic or robotic)
5. Structure the answer clearly with appropriate formatting

REQUIRED OUTPUT FORMAT:
1. Main answer with clear structure and headings where helpful
2. At the very end, add a "## Summary" section with 3-5 concise bullet points
3. If the answer includes factual claims, statistics, or external knowledge that would benefit from references, add a "## Sources" section with relevant citations
4. Do NOT add sources for opinion-based or exploratory queries - only when genuinely helpful

Do NOT mention that you're synthesizing from multiple sources. Present the answer as a direct response to the user.`;

// Sanitize conversation history
const sanitizeHistory = (history: Message[]): Message[] => {
  return history.map(m => {
    let content = m.content;
    if (typeof content === 'object' && content !== null) {
      const values = Object.values(content);
      content = typeof values[0] === 'string' ? values[0] : '';
    }
    return { role: m.role, content: typeof content === 'string' ? content : '' };
  });
};

// Call a model and get response
async function callModel(
  modelConfig: { apiModel: string; provider: string; displayName: string },
  systemPrompt: string,
  userMessage: string,
  history: Message[]
): Promise<{ content: string; success: boolean; error?: string }> {
  try {
    let apiUrl = '';
    let apiKey = '';
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let body: Record<string, unknown> = {};

    if (modelConfig.provider === 'lovable') {
      apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
      if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');
      
      apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      
      body = {
        model: modelConfig.apiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
        max_tokens: 8000,
      };
    } else if (modelConfig.provider === 'openrouter') {
      apiKey = Deno.env.get('OPENROUTER_API_KEY') || '';
      if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');
      
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = 'https://lovable.dev';
      headers['X-Title'] = 'Lovable AI Deep Research';
      
      body = {
        model: modelConfig.apiModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
        max_tokens: 8000,
      };
    } else {
      throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }

    console.log(`[Deep Research] Calling ${modelConfig.displayName} (${modelConfig.apiModel})...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Deep Research] ${modelConfig.displayName} error:`, response.status, errorText);
      
      // Handle rate limits and payment issues
      if (response.status === 429) {
        return { content: '', success: false, error: 'Rate limit exceeded. Please try again.' };
      }
      if (response.status === 402) {
        return { content: '', success: false, error: 'Insufficient credits. Please add more credits.' };
      }
      
      return { content: '', success: false, error: `Model error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log(`[Deep Research] ${modelConfig.displayName} response: ${content.substring(0, 100)}...`);
    
    return { content, success: true };
  } catch (error) {
    console.error(`[Deep Research] ${modelConfig.displayName} exception:`, error);
    return { 
      content: '', 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, conversationHistory = [] } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Deep Research] Starting research for: ${prompt.substring(0, 100)}...`);

    const sanitizedHistory = sanitizeHistory(conversationHistory);

    // STEP 1: Parallel research with Claude and Gemini
    console.log('[Deep Research] Step 1: Parallel research phase...');
    
    const [claudeResult, geminiResult] = await Promise.all([
      callModel(RESEARCH_MODELS.claude, RESEARCH_PROMPT, prompt, sanitizedHistory),
      callModel(RESEARCH_MODELS.gemini, RESEARCH_PROMPT, prompt, sanitizedHistory),
    ]);

    // Check if at least one model succeeded
    const successfulResearch: string[] = [];
    if (claudeResult.success && claudeResult.content) {
      successfulResearch.push(`### Research from Claude Opus 4.5:\n${claudeResult.content}`);
    }
    if (geminiResult.success && geminiResult.content) {
      successfulResearch.push(`### Research from Gemini 3 Pro:\n${geminiResult.content}`);
    }

    if (successfulResearch.length === 0) {
      // Both failed - return error
      const errorMsg = claudeResult.error || geminiResult.error || 'Research failed';
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Deep Research] Research phase complete. ${successfulResearch.length}/2 models succeeded.`);

    // STEP 2: Synthesis with GPT-5
    console.log('[Deep Research] Step 2: Synthesis phase with GPT-5...');
    
    const synthesisInput = `User's Question: ${prompt}

${successfulResearch.join('\n\n---\n\n')}

Now synthesize the above research into a single, comprehensive answer.`;

    const synthesisResult = await callModel(
      RESEARCH_MODELS.gpt5,
      SYNTHESIS_PROMPT,
      synthesisInput,
      [] // No history for synthesis - we're synthesizing research
    );

    if (!synthesisResult.success || !synthesisResult.content) {
      // GPT-5 failed - try to return the best research result directly
      console.log('[Deep Research] GPT-5 synthesis failed, returning best research result');
      
      const bestResearch = claudeResult.success ? claudeResult.content : geminiResult.content;
      return new Response(
        JSON.stringify({
          content: bestResearch,
          model: 'Deep Research (partial)',
          synthesized: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Deep Research] Synthesis complete!');

    return new Response(
      JSON.stringify({
        content: synthesisResult.content,
        model: 'Deep Research',
        synthesized: true,
        modelsUsed: ['Claude Opus 4.5', 'Gemini 3 Pro', 'GPT-5'],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Deep Research] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
