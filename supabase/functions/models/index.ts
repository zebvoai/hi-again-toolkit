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
        
        // Wavespeed Models
        'Seedream v4',
        'Flux Pro 1.1 Ultra',
        'Flux Dev',
        'Flux Schnell'
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
