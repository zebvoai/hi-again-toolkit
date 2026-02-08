import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Curated list of FASTEST OpenRouter models from each family
// Prioritizing speed and low latency over maximum capability
const OPENROUTER_MODELS: { displayName: string; apiId: string }[] = [
  // X.AI / Grok - fastest variant
  { displayName: 'Grok 3 Mini', apiId: 'x-ai/grok-3-mini-beta' },
  
  // DeepSeek - fastest variant
  { displayName: 'DeepSeek V3', apiId: 'deepseek/deepseek-chat' },
  
  // Qwen - fastest variant
  { displayName: 'Qwen 3 30B', apiId: 'qwen/qwen3-30b-a3b' },
  
  // Mistral - fastest variant
  { displayName: 'Mistral Small', apiId: 'mistralai/mistral-small-2503' },
  
  // Meta Llama - fastest variant
  { displayName: 'Llama 4 Scout', apiId: 'meta-llama/llama-4-scout' },
  
  // MiniMax - fast variant
  { displayName: 'MiniMax M1', apiId: 'minimax/minimax-m1' },
  
  // Cohere - fastest variant
  { displayName: 'Command R', apiId: 'cohere/command-r-08-2024' },
  
  // Perplexity - fastest variant
  { displayName: 'Perplexity Sonar', apiId: 'perplexity/sonar' },
  
  // Kimi / Moonshot - fast variant
  { displayName: 'Kimi K2', apiId: 'moonshotai/kimi-k2' },
  
  // NVIDIA - optimized variant
  { displayName: 'Nemotron 49B', apiId: 'nvidia/llama-3.3-nemotron-super-49b-v1' },
  
  // Google via OpenRouter - fastest variant
  { displayName: 'Gemma 3 12B', apiId: 'google/gemma-3-12b-it' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Base models - fastest variants
    const baseModels = [
      // OpenAI via OpenRouter - nano model (fastest)
      'GPT 4.1 Nano',
      // Anthropic (direct API) - fastest variant
      'Claude Haiku 3.5',
      // Google (via Lovable AI Gateway) - flash variant
      'Gemini 2.5 Flash',
    ];
    
    // Build mapping of display name -> API ID for OpenRouter models
    const openRouterModelMap: Record<string, string> = {};
    for (const model of OPENROUTER_MODELS) {
      openRouterModelMap[model.displayName] = model.apiId;
    }
    
    // Add base models to OpenRouter mapping
    openRouterModelMap['GPT 4.1 Nano'] = 'openai/gpt-4.1-nano';
    openRouterModelMap['Claude Haiku 3.5'] = 'anthropic/claude-3.5-haiku';
    
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
