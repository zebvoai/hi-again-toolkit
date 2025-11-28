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
        'gpt-5-2025-08-07',
        'claude-sonnet-4-20250514',
        'gemini-pro'
      ],
      image: [
        'dall-e-3',
        'stable-diffusion-xl'
      ],
      video: [
        'gen-2',
        'pika-1.0'
      ],
      build: [
        'gpt-5-2025-08-07',
        'claude-sonnet-4-20250514'
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
