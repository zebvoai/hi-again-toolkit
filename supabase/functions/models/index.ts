import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Curated list of top-quality OpenRouter models with correct API IDs
// Based on OpenRouter rankings and real usage data
const OPENROUTER_MODELS: { displayName: string; apiId: string }[] = [
  // X.AI / Grok - Top ranked models
  { displayName: 'Grok 4.1 Fast', apiId: 'x-ai/grok-4.1-fast' },
  { displayName: 'Grok 4 Fast', apiId: 'x-ai/grok-4-fast' },
  { displayName: 'Grok Code Fast', apiId: 'x-ai/grok-code-fast-1' },
  { displayName: 'Grok 3 Beta', apiId: 'x-ai/grok-3-beta' },
  
  // DeepSeek - Excellent reasoning models
  { displayName: 'DeepSeek R1', apiId: 'deepseek/deepseek-r1' },
  { displayName: 'DeepSeek V3', apiId: 'deepseek/deepseek-chat' },
  { displayName: 'DeepSeek R1 Distill Qwen 32B', apiId: 'deepseek/deepseek-r1-distill-qwen-32b' },
  
  // Qwen - High quality Chinese AI models
  { displayName: 'Qwen 3 235B', apiId: 'qwen/qwen3-235b-a22b' },
  { displayName: 'Qwen 3 32B', apiId: 'qwen/qwen3-32b' },
  { displayName: 'Qwen 3 Coder', apiId: 'qwen/qwen3-coder' },
  { displayName: 'Qwen 2.5 72B', apiId: 'qwen/qwen-2.5-72b-instruct' },
  { displayName: 'Qwen QwQ 32B', apiId: 'qwen/qwq-32b' },
  
  // Mistral - Strong European AI
  { displayName: 'Mistral Large', apiId: 'mistralai/mistral-large-2411' },
  { displayName: 'Mistral Medium', apiId: 'mistralai/mistral-medium-3' },
  { displayName: 'Codestral', apiId: 'mistralai/codestral-2501' },
  { displayName: 'Mistral Nemo', apiId: 'mistralai/mistral-nemo' },
  
  // Meta Llama - Open source excellence
  { displayName: 'Llama 4 Maverick', apiId: 'meta-llama/llama-4-maverick' },
  { displayName: 'Llama 4 Scout', apiId: 'meta-llama/llama-4-scout' },
  { displayName: 'Llama 3.3 70B', apiId: 'meta-llama/llama-3.3-70b-instruct' },
  { displayName: 'Llama 3.1 405B', apiId: 'meta-llama/llama-3.1-405b-instruct' },
  
  // MiniMax - High performance
  { displayName: 'MiniMax M2', apiId: 'minimax/minimax-m2' },
  
  // Cohere - Enterprise focused
  { displayName: 'Command R+', apiId: 'cohere/command-r-plus-08-2024' },
  { displayName: 'Command R', apiId: 'cohere/command-r-08-2024' },
  { displayName: 'Command A', apiId: 'cohere/command-a-03-2025' },
  
  // Perplexity - Search enhanced
  { displayName: 'Perplexity Sonar Pro', apiId: 'perplexity/sonar-pro' },
  { displayName: 'Perplexity Sonar', apiId: 'perplexity/sonar' },
  
  // AI21 - Jamba models
  { displayName: 'Jamba 1.6 Large', apiId: 'ai21/jamba-1.6-large' },
  { displayName: 'Jamba 1.6 Mini', apiId: 'ai21/jamba-1.6-mini' },
  
  // Microsoft - Phi models
  { displayName: 'Phi 4', apiId: 'microsoft/phi-4' },
  { displayName: 'Phi 4 Reasoning', apiId: 'microsoft/phi-4-reasoning-plus' },
  
  // NVIDIA
  { displayName: 'Nemotron 70B', apiId: 'nvidia/llama-3.1-nemotron-70b-instruct' },
  
  // Google via OpenRouter
  { displayName: 'Gemma 3 27B', apiId: 'google/gemma-3-27b-it' },
  
  // Alibaba
  { displayName: 'Marco o1', apiId: 'alibaba/marco-o1' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Base models (direct API - always included)
    const baseModels = [
      // OpenAI (direct API)
      'GPT-5',
      'GPT-5 Mini',
      'GPT-5 Nano',
      'GPT-4.1',
      'GPT-4.1 Mini',
      'O3',
      'O4 Mini',
      // Anthropic (direct API)
      'Claude Sonnet 4.5',
      'Claude Opus 4.1',
      'Claude Sonnet 4',
      'Claude Opus 4',
      'Claude Haiku 3.5',
      'Claude Sonnet 3.5',
      // Google (via Lovable AI Gateway)
      'Gemini 2.5 Pro',
      'Gemini 3 Pro',
      'Gemini 2.5 Flash',
      'Gemini 2.5 Flash Lite',
      'Gemini 2.0 Flash',
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
        // OpenAI Models
        'DALL-E 3',
        'DALL-E 2',
        
        // Google Models (via Lovable AI Gateway)
        'Gemini 2.5 Flash Image',
        'Gemini 3 Pro Image',
        
        // ByteDance - Seedream & Dreamina
        'Seedream v3',
        'Seedream v3.1',
        'Seedream v4',
        'Seedream v4 Sequential',
        'Dreamina v3.0',
        'Dreamina v3.1',
        
        // Bria
        'Bria Text to Image 3.2',
        'Bria Fibo',
        
        // Ideogram AI
        'Ideogram V2',
        'Ideogram V2a',
        'Ideogram V2 Turbo',
        'Ideogram V2a Turbo',
        'Ideogram V3 Turbo',
        'Ideogram V3 Balanced',
        'Ideogram V3 Quality',
        
        // Leonardo AI
        'Leonardo Lucid Origin',
        'Leonardo Phoenix 1.0',
        
        // Luma
        'Luma Photon',
        'Luma Photon Flash',
        
        // Recraft AI
        'Recraft 20B',
        'Recraft V3',
        
        // Reve
        'Reve Text to Image',
        
        // Stability AI
        'SDXL',
        'SDXL LoRA',
        'Stable Diffusion',
        'Stable Diffusion 3',
        'Stable Diffusion 3.5 Medium',
        'Stable Diffusion 3.5 Large',
        'Stable Diffusion 3.5 Large Turbo',
        
        // FLUX Family
        'Flux 1 SRPO',
        'Flux 1.1 Pro',
        'Flux 1.1 Pro Ultra',
        'Flux 2 Dev',
        'Flux 2 Dev LoRA',
        'Flux 2 Flex',
        'Flux 2 Pro',
        'Flux Dev',
        'Flux Dev LoRA',
        'Flux Dev LoRA Ultra Fast',
        'Flux Dev Ultra Fast',
        'Flux Krea Dev LoRA',
        'Flux Kontext Max',
        'Flux Kontext Pro',
        'Flux Schnell',
        'Flux Schnell LoRA',
        'Flux SRPO',
        
        // WAN Models
        'WAN 2.1',
        'WAN 2.1 LoRA',
        'WAN 2.2 LoRA',
        'WAN 2.2 Realism',
        'WAN 2.5',
        
        // Qwen / Jib Mix
        'Qwen Image',
        'Qwen Image LoRA',
        'Jib Mix Qwen Image',
        'Jib Mix Qwen Image LoRA',
        
        // Hunyuan
        'Hunyuan Image 3',
        
        // Z-Image
        'Z-Image Turbo',
        'Z-Image Turbo LoRA',
        
        // HiDream
        'HiDream i1 Dev',
        'HiDream i1 Full',
        
        // Other WaveSpeed Models
        'Chroma',
        'Female Human'
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
