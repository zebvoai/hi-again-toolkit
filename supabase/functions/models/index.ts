import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Curated list of top-quality OpenRouter models with correct API IDs
// Based on OpenRouter rankings and real usage data
const OPENROUTER_MODELS: { displayName: string; apiId: string }[] = [
  // X.AI / Grok - flagship only
  { displayName: 'Grok 4.1 Fast', apiId: 'x-ai/grok-4.1-fast' },
  
  // DeepSeek - flagship only
  { displayName: 'DeepSeek R1', apiId: 'deepseek/deepseek-r1' },
  
  // Qwen - flagship only
  { displayName: 'Qwen 3 32B', apiId: 'qwen/qwen3-32b' },
  
  // Mistral - flagship only
  { displayName: 'Mistral Large', apiId: 'mistralai/mistral-large-2411' },
  
  // Meta Llama - flagship only
  { displayName: 'Llama 4 Maverick', apiId: 'meta-llama/llama-4-maverick' },
  
  // MiniMax
  { displayName: 'MiniMax M2', apiId: 'minimax/minimax-m2' },
  
  // Cohere - flagship only
  { displayName: 'Command A', apiId: 'cohere/command-a-03-2025' },
  
  // Perplexity - flagship only
  { displayName: 'Perplexity Sonar Pro', apiId: 'perplexity/sonar-pro' },
  
  // Kimi / Moonshot - flagship only
  { displayName: 'Kimi K2', apiId: 'moonshotai/kimi-k2' },
  
  // Microsoft - flagship only
  { displayName: 'Phi 4 Reasoning', apiId: 'microsoft/phi-4-reasoning-plus' },
  
  // NVIDIA
  { displayName: 'Nemotron 70B', apiId: 'nvidia/llama-3.1-nemotron-70b-instruct' },
  
  // Google via OpenRouter
  { displayName: 'Gemma 3 27B', apiId: 'google/gemma-3-27b-it' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Base models (direct API - flagship only)
    const baseModels = [
      // OpenAI (direct API) - flagship only
      'GPT-5',
      // Anthropic (direct API) - flagship only
      'Claude Opus 4.5',
      // Google (via Lovable AI Gateway) - flagship only
      'Gemini 3 Pro',
    ];
    
    // Build mapping of display name -> API ID for OpenRouter models
    const openRouterModelMap: Record<string, string> = {};
    for (const model of OPENROUTER_MODELS) {
      openRouterModelMap[model.displayName] = model.apiId;
    }
    
    // Combine: base models + OpenRouter display names
    const openRouterDisplayNames = OPENROUTER_MODELS.map(m => m.displayName);
    const allTextModels = [...baseModels, ...openRouterDisplayNames];
    
    const availableModels = {
      // Include the mapping so chat function can use it
      _openRouterModelMap: openRouterModelMap,
      text: allTextModels,
      image: [
        // Fixed list of 7 image models as specified
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
