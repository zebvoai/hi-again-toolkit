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
// Only including verified working models to avoid API errors
const modelMapping: Record<string, { api: string; provider: 'lovable' | 'openai' | 'wavespeed' }> = {
  'gpt-image-1': { api: 'gpt-image-1', provider: 'openai' },
  'dall-e-3': { api: 'dall-e-3', provider: 'openai' },
  'dall-e-2': { api: 'dall-e-2', provider: 'openai' },
  'gemini-2.5-flash-image': { api: 'google/gemini-2.5-flash-image', provider: 'lovable' },
  'gemini-3-pro-image': { api: 'google/gemini-3-pro-image-preview', provider: 'lovable' },
  
  // ByteDance - Seedream (Verified working)
  'seedream-v4': { api: 'bytedance/seedream-v4', provider: 'wavespeed' },
  
  // Ideogram AI (Verified working)
  'ideogram-v2': { api: 'ideogram-ai/ideogram-v2', provider: 'wavespeed' },
  'ideogram-v2-turbo': { api: 'ideogram-ai/ideogram-v2-turbo', provider: 'wavespeed' },
  'ideogram-v2a-turbo': { api: 'ideogram-ai/ideogram-v2a-turbo', provider: 'wavespeed' },
  'ideogram-v3-turbo': { api: 'ideogram-ai/ideogram-v3-turbo', provider: 'wavespeed' },
  'ideogram-v3-balanced': { api: 'ideogram-ai/ideogram-v3-balanced', provider: 'wavespeed' },
  
  // Recraft AI (Verified working)
  'recraft-20b': { api: 'recraft-ai/recraft-20b', provider: 'wavespeed' },
  
  // Stability AI (Verified working)
  'stable-diffusion': { api: 'stability-ai/stable-diffusion', provider: 'wavespeed' },
  'stable-diffusion-3': { api: 'stability-ai/stable-diffusion-3', provider: 'wavespeed' },
  'stable-diffusion-3.5-large': { api: 'stability-ai/stable-diffusion-3.5-large', provider: 'wavespeed' },
  
  // FLUX Family (Verified working)
  'flux-pro-1.1-ultra': { api: 'black-forest-labs/flux-pro-1.1-ultra', provider: 'wavespeed' },
  'flux-dev': { api: 'wavespeed-ai/flux-dev', provider: 'wavespeed' },
  'flux-schnell': { api: 'wavespeed-ai/flux-schnell', provider: 'wavespeed' },
  'flux-redux-dev': { api: 'wavespeed-ai/flux-redux-dev', provider: 'wavespeed' },
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
    
    // Use Wavespeed for Seedream, Flux, and other models
    if (actualProvider === 'wavespeed') {
      const wavespeedApiKey = Deno.env.get('WAVESPEED_API_KEY');
      
      if (!wavespeedApiKey) {
        throw new Error('WAVESPEED_API_KEY not configured');
      }
      
      // Submit the task to Wavespeed
      const submitResponse = await fetch(`https://api.wavespeed.ai/api/v3/${actualModel}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wavespeedApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          size: '1024*1024',
          num_images: 1,
          enable_base64_output: false, // Get URL instead of base64
          enable_sync_mode: false
        })
      });
      
      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Wavespeed submit error:', submitResponse.status, errorText);
        throw new Error(`Wavespeed API error: ${submitResponse.status}`);
      }
      
      const submitData = await submitResponse.json();
      
      // Some Wavespeed models are synchronous and return the image directly
      // while others are async and return a request ID that must be polled.
      let imageUrlFromSync: string | null = null;
      const requestId = submitData.id;
      
      if (!requestId) {
        if (submitData.output && Array.isArray(submitData.output) && submitData.output.length > 0) {
          imageUrlFromSync = submitData.output[0];
        } else {
          console.error('Wavespeed unexpected response format:', submitData);
          throw new Error('Wavespeed API did not return a request ID or image output');
        }
      }
      
      // If we already have an image URL (synchronous models), return immediately
      if (imageUrlFromSync) {
        console.log('Image generated synchronously with Wavespeed');
        return new Response(
          JSON.stringify({
            imageUrl: imageUrlFromSync,
            revisedPrompt: prompt,
            model: model || actualModel
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      console.log('Wavespeed task submitted:', requestId);
      
      // Poll for results (max 60 seconds for image generation)
      let imageUrl = null;
      const maxAttempts = 60;
      const pollInterval = 1000; // 1 second
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const resultResponse = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${wavespeedApiKey}`
          }
        });
        
        if (!resultResponse.ok) {
          const errorText = await resultResponse.text();
          console.error(`Wavespeed poll error (attempt ${attempt + 1}):`, resultResponse.status, errorText);
          continue;
        }
        
        const resultData = await resultResponse.json();
        console.log(`Wavespeed status (attempt ${attempt + 1}):`, resultData.status);
        
        // Check if generation is complete
        if (resultData.status === 'succeeded' && resultData.output?.length > 0) {
          imageUrl = resultData.output[0];
          console.log('Image generated successfully with Wavespeed');
          break;
        } else if (resultData.status === 'failed') {
          throw new Error(`Wavespeed generation failed: ${resultData.error || 'Unknown error'}`);
        }
        // Continue polling if status is 'processing' or 'starting'
      }
      
      if (!imageUrl) {
        throw new Error('Image generation timed out after 60 seconds');
      }
      
      return new Response(
        JSON.stringify({
          imageUrl,
          revisedPrompt: prompt,
          model: model || actualModel
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
