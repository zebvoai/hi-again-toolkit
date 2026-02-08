import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fast models internally, displayed as flagship names to users
// Maps: Display Name (flagship) -> API ID (fast variant)
const OPENROUTER_MODELS: { displayName: string; apiId: string }[] = [
  // X.AI / Grok - display as Grok 4, use fast variant
  { displayName: 'Grok 4', apiId: 'x-ai/grok-3-mini-beta' },
  
  // DeepSeek - display as DeepSeek-R1
  { displayName: 'DeepSeek-R1', apiId: 'deepseek/deepseek-chat' },
  
  // Qwen - display as Qwen3-Max
  { displayName: 'Qwen3-Max', apiId: 'qwen/qwen3-235b-a22b' },
  
  // Mistral - display as Mistral Large 3
  { displayName: 'Mistral Large 3', apiId: 'mistralai/mistral-small-3.1-24b-instruct' },
  
  // MiniMax - display as MiniMax M2.1
  { displayName: 'MiniMax M2.1', apiId: 'minimax/minimax-m1' },
  
  // Cohere - display as Command A
  { displayName: 'Command A', apiId: 'cohere/command-r-08-2024' },
  
  // Perplexity - display as Perplexity Sonar Pro
  { displayName: 'Perplexity Sonar Pro', apiId: 'perplexity/sonar' },
  
  // Kimi / Moonshot - display as Kimi K2.5
  { displayName: 'Kimi K2.5', apiId: 'moonshotai/kimi-k2' },
  
  // NVIDIA - display as Nemotron 3 Ultra
  { displayName: 'Nemotron 3 Ultra', apiId: 'nvidia/llama-3.1-nemotron-70b-instruct' },
  
  // Google Gemma - display as Gemma 3 27B
  { displayName: 'Gemma 3 27B', apiId: 'google/gemma-3-27b-it' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Base models - displayed as flagship names, use fast variants internally
    const baseModels = [
      // OpenAI - display as GPT 5.2, use nano internally
      'GPT 5.2',
      // Anthropic - display as Claude Opus 4.6, use haiku internally
      'Claude Opus 4.6',
      // Google - display as Gemini 3 Pro, use flash internally
      'Gemini 3 Pro',
    ];
    
    // Build mapping of display name -> API ID for OpenRouter models
    const openRouterModelMap: Record<string, string> = {};
    for (const model of OPENROUTER_MODELS) {
      openRouterModelMap[model.displayName] = model.apiId;
    }
    
    // Add base models - flagship display names map to fast API IDs
    openRouterModelMap['GPT 5.2'] = 'openai/gpt-4.1-nano';
    openRouterModelMap['Claude Opus 4.6'] = 'anthropic/claude-3.5-haiku';
    openRouterModelMap['Gemini 3 Pro'] = 'google/gemini-2.5-flash';
    
    // Combine: base models + OpenRouter display names
    const openRouterDisplayNames = OPENROUTER_MODELS.map(m => m.displayName);
    const allTextModels = [...baseModels, ...openRouterDisplayNames];
    
    const availableModels = {
      // Include the mapping so chat function can use it
      _openRouterModelMap: openRouterModelMap,
      text: allTextModels,
      image: [
        // Fixed list of 7 image models via Wavespeed API
        'Vidu Q2',
        'WAN 2.6',
        'Nano Banana Pro',
        'GPT Image 1.5',
        'MiniMax Image 01',
        'Qwen Image',
        'Grok Imagine'
      ],
      video: [
        'Gemini Video 2.0',
        'Gemini Video Flash',
        
        // Alibaba WAN Models
        'WAN 2.1 T2V 480p',
        'WAN 2.1 T2V 720p',
        'WAN 2.2 Plus T2V'
      ],
      build: [
        'GPT-5',
        'Claude Sonnet 4.5'
      ],
      research: [
        'Sonar Deep Research',
        'Sonar Pro',
        'Gemini 2.5 Pro Research',
        'O3 Deep Research',
        'O4 Mini Deep Research',
        'DeepSeek Reasoner'
      ]
    };
    
    return new Response(
      JSON.stringify(availableModels),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Models error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
