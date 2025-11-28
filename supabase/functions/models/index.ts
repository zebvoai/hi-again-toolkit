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
        
        // Neta.art
        'Neta Lumina',
        
        // Recraft AI
        'Recraft 20B',
        'Recraft 20B SVG',
        'Recraft V3',
        'Recraft V3 SVG',
        
        // Reve
        'Reve Text to Image',
        
        // RunwayML
        'Runway Gen4 Image',
        'Runway Gen4 Image Turbo',
        
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
        'Flux Redux Dev',
        
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
        'Hunyuan Image 2.1',
        'Hunyuan Image 3',
        
        // Z-Image
        'Z-Image Turbo',
        'Z-Image Turbo LoRA',
        
        // HiDream
        'HiDream i1 Dev',
        'HiDream i1 Full',
        
        // Other WaveSpeed Models
        'Chroma',
        'Female Human',
        'Step1x Edit'
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
