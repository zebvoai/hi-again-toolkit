import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageRequest {
  prompt: string;
  provider?: string;
  model?: string;
}

// Map frontend model names to API model names
const modelMapping: Record<string, { api: string; provider: 'lovable' | 'openai' }> = {
  'gpt-image-1': { api: 'gpt-image-1', provider: 'openai' },
  'dall-e-3': { api: 'dall-e-3', provider: 'openai' },
  'dall-e-2': { api: 'dall-e-2', provider: 'openai' },
  'gemini-2.5-flash-image': { api: 'google/gemini-2.5-flash-image', provider: 'lovable' },
  'gemini-3-pro-image': { api: 'google/gemini-3-pro-image-preview', provider: 'lovable' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, provider, model }: ImageRequest = await req.json();
    
    console.log('Image generation request:', { prompt, provider, model });
    
    // Determine the actual provider and model to use
    const modelConfig = model ? modelMapping[model.toLowerCase().replace(/\s+/g, '-')] : undefined;
    const actualProvider = modelConfig?.provider || 'lovable';
    const actualModel = modelConfig?.api || 'google/gemini-2.5-flash-image';
    
    console.log('Using provider:', actualProvider, 'model:', actualModel);
    
    // Use Lovable AI for Gemini and Stable Diffusion models
    if (actualProvider === 'lovable') {
      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      
      if (!lovableApiKey) {
        throw new Error('LOVABLE_API_KEY not configured');
      }
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: actualModel,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          modalities: ['image', 'text']
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        throw new Error(`Image generation failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Image generated successfully with Lovable AI');
      
      // Extract the base64 image from the response
      const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageBase64) {
        throw new Error('No image returned from API');
      }
      
      return new Response(
        JSON.stringify({
          imageUrl: imageBase64,
          revisedPrompt: prompt,
          model: model || actualModel
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Use OpenAI for DALL-E models
    if (actualProvider === 'openai') {
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      
      // Retry logic for transient 500 errors
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: actualModel,
              prompt,
              n: 1,
              size: '1024x1024'
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenAI error (attempt ${attempt}/3):`, response.status, errorText);
            
            // Retry on 500 errors (server issues)
            if (response.status === 500 && attempt < 3) {
              lastError = `OpenAI server error (${response.status})`;
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              continue;
            }
            
            throw new Error(`OpenAI API error: ${response.status}. ${response.status === 500 ? 'Server temporarily unavailable. Please try again or use Gemini models.' : 'Please check your request.'}`);
          }
      
          const data = await response.json();
          console.log(`Image generated successfully with OpenAI (attempt ${attempt}/3)`);
          
          return new Response(
            JSON.stringify({
              imageUrl: data.data[0].url,
              revisedPrompt: data.data[0].revised_prompt,
              model: model || actualModel
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
          if (attempt === 3) throw error;
        }
      }
      
      throw new Error(lastError || 'OpenAI image generation failed after 3 attempts');
    }
    
    throw new Error('Provider not supported for image generation');
    
  } catch (error) {
    console.error('Image generation error:', error);
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
