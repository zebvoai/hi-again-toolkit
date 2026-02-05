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
    displayName: 'Gemini 2.5 Pro',
    apiModel: 'gemini-2.5-pro',
    provider: 'google',
  },
  gpt5: {
    displayName: 'GPT-5',
    apiModel: 'openai/gpt-5',
    provider: 'openrouter',
  },
};

// Research prompt for Claude and Gemini - focuses on deep, comprehensive analysis
const RESEARCH_PROMPT = `You are a deep research analyst conducting thorough, comprehensive research.

Your task is to provide a DETAILED analysis of the user's question.

CRITICAL REQUIREMENTS:
- Your response MUST be at least 500-800 words
- Cover the most important aspects of the topic
- Include multiple perspectives and viewpoints
- Provide examples, evidence, and supporting data
- Explore key nuances and lesser-known aspects

Structure your analysis with:
1. Background and context
2. Core analysis with sub-sections
3. Examples or case studies
4. Different perspectives
5. Practical implications

Guidelines:
- Be thorough but focused - prioritize depth on the most important aspects
- Highlight uncertainties or areas of debate
- Do NOT format as a final answer - you're providing research notes
- Do NOT add conversational intros or conclusions
- Just provide your detailed analysis directly

Your research will be synthesized with another model's findings to create the final comprehensive response.`;

// Synthesis prompt for GPT-5 - merges research outputs into comprehensive answer
const SYNTHESIS_PROMPT = `You are synthesizing research from multiple AI analysts into a single, high-quality, well-structured answer.

You will receive research from two sources. Your job is to create a CLEAR, THOROUGH response.

CRITICAL REQUIREMENTS:
- Your final response MUST be approximately 1000 words (800-1200 word range)
- Merge the best insights from both sources
- Create a well-structured, readable document
- Include key examples and evidence from the research
- Maintain depth while being concise

REQUIRED OUTPUT STRUCTURE:
1. **Introduction** - Set the context and scope (80-120 words)
2. **Main Content** - Key sections with headings covering the most important aspects (600-800 words)
   - Use clear headings (##) and subheadings (###)
   - Include the best examples and evidence from research
   - Cover different perspectives
3. **Conclusion** - Synthesize key takeaways (80-120 words)
4. **## Summary** - 4-6 concise bullet points capturing the main insights
5. **## Sources** - If factual claims benefit from references, add clickable markdown links: [Source Title](URL)

IMPORTANT:
- Do NOT mention that you're synthesizing from multiple sources
- Present the answer as a direct, authoritative response to the user
- Make all source URLs clickable using markdown link syntax
- Keep it around 1000 words - be comprehensive but not bloated`;

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

    if (modelConfig.provider === 'google') {
      apiKey = Deno.env.get('GOOGLE_API_KEY') || '';
      if (!apiKey) throw new Error('GOOGLE_API_KEY not configured');
      
      // Use Google's Generative Language API directly
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.apiModel}:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      
      body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 16000,
          temperature: 0.7,
        }
      };
      
      // For Google, we need different response parsing
      console.log(`[Deep Research] Calling ${modelConfig.displayName} (${modelConfig.apiModel}) via Google API...`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Deep Research] ${modelConfig.displayName} error:`, response.status, errorText);
        
        if (response.status === 429) {
          return { content: '', success: false, error: 'Rate limit exceeded. Please try again.' };
        }
        if (response.status === 402) {
          return { content: '', success: false, error: 'Insufficient credits. Please add more credits.' };
        }
        
        return { content: '', success: false, error: `Model error: ${response.status}` };
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log(`[Deep Research] ${modelConfig.displayName} response: ${content.substring(0, 100)}...`);
      
      return { content, success: true };
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
        max_tokens: 16000,
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
      successfulResearch.push(`### Research from Gemini 2.5 Pro:\n${geminiResult.content}`);
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
        modelsUsed: ['Claude Opus 4.5', 'Gemini 2.5 Pro', 'GPT-5'],
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
