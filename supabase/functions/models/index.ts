import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
  architecture?: {
    modality?: string;
    tokenizer?: string;
  };
}

async function fetchOpenRouterModels(): Promise<string[]> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY not configured');
    return [];
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status);
      return [];
    }

    const data = await response.json();
    const models = data.data as OpenRouterModel[];

    // Filter and rank models
    const filteredModels = models
      .filter(model => {
        const modality = model.architecture?.modality?.toLowerCase() || '';
        const id = model.id.toLowerCase();
        const name = model.name.toLowerCase();
        
        // Exclude non-text models
        if (modality.includes('image') || modality.includes('vision') || 
            modality.includes('video') || modality.includes('audio') ||
            modality.includes('multimodal') || modality.includes('embedding')) {
          return false;
        }
        
        // Exclude image/vision models by name
        if (id.includes('vision') || id.includes('image') || name.includes('vision')) {
          return false;
        }
        
        // Exclude deprecated/offline/blocked
        if (id.includes('deprecated') || id.includes('offline') || id.includes('blocked')) {
          return false;
        }
        
        // Exclude extremely heavy models (>200B)
        if (id.includes('405b') || id.includes('236b')) {
          return false;
        }
        
        return true;
      })
      .map(model => {
        const promptPrice = parseFloat(model.pricing.prompt);
        const contextLength = model.context_length || 0;
        const maxTokens = model.top_provider?.max_completion_tokens || 0;
        
        // Calculate score
        let score = 0;
        
        // Prioritize recent models (2024-2025)
        if (model.id.includes('2024') || model.id.includes('2025')) {
          score += 50;
        }
        
        // High context length
        if (contextLength >= 100000) score += 30;
        else if (contextLength >= 50000) score += 20;
        else if (contextLength >= 10000) score += 10;
        
        // Low cost
        if (promptPrice < 0.0001) score += 25;
        else if (promptPrice < 0.001) score += 15;
        else if (promptPrice < 0.01) score += 5;
        
        // High output capacity
        if (maxTokens >= 16000) score += 20;
        else if (maxTokens >= 8000) score += 10;
        
        // Prefer modern architectures
        if (model.id.includes('gpt-5') || model.id.includes('claude-4') || 
            model.id.includes('gemini-3') || model.id.includes('o3')) {
          score += 40;
        } else if (model.id.includes('gpt-4') || model.id.includes('claude-3') || 
                   model.id.includes('gemini-2')) {
          score += 25;
        }
        
        return { ...model, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(model => model.name);

    return filteredModels;
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    // Retry once
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const models = data.data as OpenRouterModel[];

      const filteredModels = models
        .filter(model => {
          const modality = model.architecture?.modality?.toLowerCase() || '';
          const id = model.id.toLowerCase();
          const name = model.name.toLowerCase();
          
          if (modality.includes('image') || modality.includes('vision') || 
              modality.includes('video') || modality.includes('audio') ||
              modality.includes('multimodal') || modality.includes('embedding')) {
            return false;
          }
          
          if (id.includes('vision') || id.includes('image') || name.includes('vision')) {
            return false;
          }
          
          if (id.includes('deprecated') || id.includes('offline') || id.includes('blocked')) {
            return false;
          }
          
          if (id.includes('405b') || id.includes('236b')) {
            return false;
          }
          
          return true;
        })
        .slice(0, 20)
        .map(model => model.name);

      return filteredModels;
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      return [];
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Base models (always included) - Gemini 1.5 models removed (deprecated)
    const baseModels = [
      // OpenAI
      'GPT-5',
      'GPT-5 Mini',
      'GPT-5 Nano',
      'GPT-4.1',
      'GPT-4.1 Mini',
      'O3',
      'O4 Mini',
      // Anthropic
      'Claude Sonnet 4.5',
      'Claude Opus 4.1',
      'Claude Sonnet 4',
      'Claude Opus 4',
      'Claude Haiku 3.5',
      'Claude Sonnet 3.5',
      // Google (via Lovable AI Gateway - no quota issues)
      'Gemini 2.5 Pro',
      'Gemini 3 Pro',
      'Gemini 2.5 Flash',
      'Gemini 2.5 Flash Lite',
      'Gemini 2.0 Flash',
    ];
    
    // Fetch and append OpenRouter models
    const openRouterModels = await fetchOpenRouterModels();
    
    // Combine: base models + OpenRouter models (remove duplicates)
    const allTextModels = [...new Set([...baseModels, ...openRouterModels])];
    
    const availableModels = {
      text: allTextModels,
      image: [
        // OpenAI Models
        'DALL-E 3',
        'DALL-E 2',
        
        // Google Models
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
        
        // RunwayML (image-to-image models removed)
        
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
