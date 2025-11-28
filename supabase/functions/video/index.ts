import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoRequest {
  prompt: string;
  model?: string;
  provider?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model = 'runway-gen-2', provider } = await req.json() as VideoRequest;
    
    console.log('Video generation request:', { prompt, model, provider });

    // Note: OpenAI does not have a video generation API as of now
    // This implementation is a placeholder for Runway and Pika APIs
    
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured. Please note that OpenAI does not currently offer video generation. You would need Runway or Pika API keys for video generation.' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check which model is being used
    const modelLower = model.toLowerCase();
    
    if (modelLower.includes('runway')) {
      return new Response(
        JSON.stringify({ 
          error: 'Runway Gen-2 API integration is not yet implemented. Please add your Runway API key to use this model.' 
        }),
        { 
          status: 501,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (modelLower.includes('pika')) {
      return new Response(
        JSON.stringify({ 
          error: 'Pika 1.0 API integration is not yet implemented. Please add your Pika API key to use this model.' 
        }),
        { 
          status: 501,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If trying to use OpenAI for video (which doesn't exist)
    return new Response(
      JSON.stringify({ 
        error: 'OpenAI does not currently offer a video generation API. For video generation, you need to use:\n- Runway Gen-2 (requires Runway API key)\n- Pika 1.0 (requires Pika API key)\n\nPlease select a video model and provide the appropriate API key.' 
      }),
      { 
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Video generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});