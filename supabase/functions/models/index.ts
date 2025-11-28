import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const availableModels = {
      text: [
        // OpenAI Models
        'GPT-5',
        'GPT-5 Mini',
        'GPT-5 Nano',
        'GPT-4.1',
        'GPT-4.1 Mini',
        'O3',
        'O4 Mini',
        
        // Anthropic Models
        'Claude Sonnet 4.5',
        'Claude Opus 4.1',
        'Claude Sonnet 4',
        
        // Google Models
        'Gemini 2.5 Pro',
        'Gemini 3 Pro',
        'Gemini 2.5 Flash',
        'Gemini 2.5 Flash Lite'
      ],
      image: [
        // OpenAI Models
        'gpt-image-1',
        'DALL-E 3',
        'DALL-E 2',
        
        // Google Models
        'Gemini 2.5 Flash Image',
        'Gemini 3 Pro Image',
        
        // Alibaba
        'WAN 2.5',
        
        // ByteDance - Seedream
        'Seedream v3',
        'Seedream v3.1',
        'Seedream v4',
        'Seedream v4 Sequential',
        'Dreamina v3.0',
        'Dreamina v3.1',
        
        // Bria
        'Bria 3.2',
        'Bria Fibo',
        
        // Ideogram AI
        'Ideogram V2',
        'Ideogram V2a',
        'Ideogram V2a Turbo',
        'Ideogram V2 Turbo',
        'Ideogram V3 Balanced',
        'Ideogram V3 Quality',
        'Ideogram V3 Turbo',
        
        // Leonardo AI
        'Leonardo Lucid Origin',
        'Leonardo Phoenix 1.0',
        
        // Luma
        'Luma Photon',
        'Luma Photon Flash',
        
        // Neta.art
        'Neta Lumina',
        
        // Recraft AI
        'Recraft 20B',
        'Recraft 20B SVG',
        'Recraft V3',
        'Recraft V3 SVG',
        
        // Reve
        'Reve Image',
        
        // RunwayML
        'Runway Gen4',
        'Runway Gen4 Turbo',
        
        // Stability AI
        'SDXL',
        'SDXL LoRA',
        'Stable Diffusion',
        'Stable Diffusion 3',
        'Stable Diffusion 3.5 Medium',
        'Stable Diffusion 3.5 Large',
        'Stable Diffusion 3.5 Large Turbo',
        
        // FLUX Family
        'FLUX 1 SRPO',
        'FLUX 1.1 Pro',
        'Flux Pro 1.1 Ultra',
        'FLUX 2 Dev',
        'FLUX 2 Dev LoRA',
        'FLUX 2 Flex',
        'FLUX 2 Pro',
        'Flux Dev',
        'FLUX Dev LoRA',
        'FLUX Dev LoRA Ultra Fast',
        'FLUX Dev Ultra Fast',
        'FLUX Krea Dev LoRA',
        'FLUX Kontext Max',
        'FLUX Kontext Pro',
        'Flux Schnell',
        'FLUX Schnell LoRA',
        'FLUX SRPO',
        'Flux Redux Dev',
        
        // WAN Models
        'WAN 2.1',
        'WAN 2.1 LoRA',
        'WAN 2.2 LoRA',
        'WAN 2.2 Realism',
        'WAN 2.5 WaveSpeed',
        
        // Qwen / Jib Mix
        'Qwen Image',
        'Qwen Image LoRA',
        'Jib Mix Qwen',
        'Jib Mix Qwen LoRA',
        
        // Hunyuan
        'Hunyuan 2.1',
        'Hunyuan 3',
        
        // Z-Image
        'Z-Image Turbo',
        'Z-Image Turbo LoRA',
        
        // HiDream
        'HiDream i1 Dev',
        'HiDream i1 Full',
        
        // Other WaveSpeed Models
        'Chroma',
        'Female Human',
        'Step1X Edit',
        'Any LLM Vision'
      ],
      video: [
        'Gemini Video 2.0',
        'Gemini Video Flash'
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
