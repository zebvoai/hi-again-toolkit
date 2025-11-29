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
const modelMapping: Record<string, { api: string; provider: 'lovable' | 'openai' | 'wavespeed'; requiresInputImage?: boolean }> = {
  'gpt-image-1': { api: 'gpt-image-1', provider: 'openai' },
  'dall-e-3': { api: 'dall-e-3', provider: 'openai' },
  'dall-e-2': { api: 'dall-e-2', provider: 'openai' },
  'gemini-2.5-flash-image': { api: 'google/gemini-2.5-flash-image', provider: 'lovable' },
  'gemini-3-pro-image': { api: 'google/gemini-3-pro-image-preview', provider: 'lovable' },
  
  // ByteDance - Seedream & Dreamina
  'seedream-v3': { api: 'bytedance/seedream-v3', provider: 'wavespeed' },
  'seedream-v3.1': { api: 'bytedance/seedream-v3.1', provider: 'wavespeed' },
  'seedream-v4': { api: 'bytedance/seedream-v4', provider: 'wavespeed' },
  'seedream-v4-sequential': { api: 'bytedance/seedream-v4/sequential', provider: 'wavespeed' },
  'dreamina-v3.0': { api: 'bytedance/dreamina-v3.0/text-to-image', provider: 'wavespeed' },
  'dreamina-v3.1': { api: 'bytedance/dreamina-v3.1/text-to-image', provider: 'wavespeed' },
  
  // Bria
  'bria-text-to-image-3.2': { api: 'bria/text-to-image-3.2', provider: 'wavespeed' },
  'bria-fibo': { api: 'bria/fibo', provider: 'wavespeed' },
  
  // Ideogram AI
  'ideogram-v2': { api: 'ideogram-ai/ideogram-v2', provider: 'wavespeed' },
  'ideogram-v2a': { api: 'ideogram-ai/ideogram-v2a', provider: 'wavespeed' },
  'ideogram-v2-turbo': { api: 'ideogram-ai/ideogram-v2-turbo', provider: 'wavespeed' },
  'ideogram-v2a-turbo': { api: 'ideogram-ai/ideogram-v2a-turbo', provider: 'wavespeed' },
  'ideogram-v3-turbo': { api: 'ideogram-ai/ideogram-v3-turbo', provider: 'wavespeed' },
  'ideogram-v3-balanced': { api: 'ideogram-ai/ideogram-v3-balanced', provider: 'wavespeed' },
  'ideogram-v3-quality': { api: 'ideogram-ai/ideogram-v3-quality', provider: 'wavespeed' },
  
  // Leonardo AI
  'leonardo-lucid-origin': { api: 'leonardoai/lucid-origin', provider: 'wavespeed' },
  'leonardo-phoenix-1.0': { api: 'leonardoai/phoenix-1.0', provider: 'wavespeed' },
  
  // Luma
  'luma-photon': { api: 'luma/photon', provider: 'wavespeed' },
  'luma-photon-flash': { api: 'luma/photon-flash', provider: 'wavespeed' },
  
  // Neta.art
  'neta-lumina': { api: 'neta-art/neta-lumina', provider: 'wavespeed' },
  
  // Recraft AI
  'recraft-20b': { api: 'recraft-ai/recraft-20b', provider: 'wavespeed' },
  'recraft-20b-svg': { api: 'recraft-ai/recraft-20b-svg', provider: 'wavespeed' },
  'recraft-v3': { api: 'recraft-ai/recraft-v3', provider: 'wavespeed' },
  'recraft-v3-svg': { api: 'recraft-ai/recraft-v3-svg', provider: 'wavespeed' },
  
  // Reve
  'reve-text-to-image': { api: 'reve/text-to-image', provider: 'wavespeed' },
  
  // RunwayML
  'runway-gen4-image': { api: 'runwayml/gen4-image', provider: 'wavespeed', requiresInputImage: true },
  'runway-gen4-image-turbo': { api: 'runwayml/gen4-image-turbo', provider: 'wavespeed', requiresInputImage: true },
  
  // Stability AI
  'sdxl': { api: 'stability-ai/sdxl', provider: 'wavespeed' },
  'sdxl-lora': { api: 'stability-ai/sdxl-lora', provider: 'wavespeed' },
  'stable-diffusion': { api: 'stability-ai/stable-diffusion', provider: 'wavespeed' },
  'stable-diffusion-3': { api: 'stability-ai/stable-diffusion-3', provider: 'wavespeed' },
  'stable-diffusion-3.5-medium': { api: 'stability-ai/stable-diffusion-3.5-medium', provider: 'wavespeed' },
  'stable-diffusion-3.5-large': { api: 'stability-ai/stable-diffusion-3.5-large', provider: 'wavespeed' },
  'stable-diffusion-3.5-large-turbo': { api: 'stability-ai/stable-diffusion-3.5-large-turbo', provider: 'wavespeed' },
  
  // FLUX Family
  'flux-1-srpo': { api: 'wavespeed-ai/flux-1-srpo', provider: 'wavespeed' },
  'flux-1.1-pro': { api: 'wavespeed-ai/flux-1.1-pro', provider: 'wavespeed' },
  'flux-1.1-pro-ultra': { api: 'wavespeed-ai/flux-1.1-pro-ultra', provider: 'wavespeed' },
  'flux-2-dev': { api: 'wavespeed-ai/flux-2-dev/text-to-image', provider: 'wavespeed' },
  'flux-2-dev-lora': { api: 'wavespeed-ai/flux-2-dev/text-to-image-lora', provider: 'wavespeed' },
  'flux-2-flex': { api: 'wavespeed-ai/flux-2-flex/text-to-image', provider: 'wavespeed' },
  'flux-2-pro': { api: 'wavespeed-ai/flux-2-pro/text-to-image', provider: 'wavespeed' },
  'flux-dev': { api: 'wavespeed-ai/flux-dev', provider: 'wavespeed' },
  'flux-dev-lora': { api: 'wavespeed-ai/flux-dev-lora', provider: 'wavespeed' },
  'flux-dev-lora-ultra-fast': { api: 'wavespeed-ai/flux-dev-lora-ultra-fast', provider: 'wavespeed' },
  'flux-dev-ultra-fast': { api: 'wavespeed-ai/flux-dev-ultra-fast', provider: 'wavespeed' },
  'flux-krea-dev-lora': { api: 'wavespeed-ai/flux-krea-dev-lora', provider: 'wavespeed' },
  'flux-kontext-max': { api: 'wavespeed-ai/flux-kontext-max/text-to-image', provider: 'wavespeed' },
  'flux-kontext-pro': { api: 'wavespeed-ai/flux-kontext-pro/text-to-image', provider: 'wavespeed' },
  'flux-schnell': { api: 'wavespeed-ai/flux-schnell', provider: 'wavespeed' },
  'flux-schnell-lora': { api: 'wavespeed-ai/flux-schnell-lora', provider: 'wavespeed' },
  'flux-srpo': { api: 'wavespeed-ai/flux-srpo', provider: 'wavespeed' },
  'flux-redux-dev': { api: 'wavespeed-ai/flux-redux-dev', provider: 'wavespeed', requiresInputImage: true },
  
  // WAN Models
  'wan-2.1': { api: 'wavespeed-ai/wan-2.1/text-to-image', provider: 'wavespeed' },
  'wan-2.1-lora': { api: 'wavespeed-ai/wan-2.1/text-to-image-lora', provider: 'wavespeed' },
  'wan-2.2-lora': { api: 'wavespeed-ai/wan-2.2/text-to-image-lora', provider: 'wavespeed' },
  'wan-2.2-realism': { api: 'wavespeed-ai/wan-2.2/text-to-image-realism', provider: 'wavespeed' },
  'wan-2.5': { api: 'alibaba/wan-2.5/text-to-image', provider: 'wavespeed' },
  
  // Qwen / Jib Mix
  'qwen-image': { api: 'wavespeed-ai/qwen-image/text-to-image', provider: 'wavespeed' },
  'qwen-image-lora': { api: 'wavespeed-ai/qwen-image/text-to-image-lora', provider: 'wavespeed' },
  'jib-mix-qwen-image': { api: 'wavespeed-ai/jib-mix-qwen-image/text-to-image', provider: 'wavespeed' },
  'jib-mix-qwen-image-lora': { api: 'wavespeed-ai/jib-mix-qwen-image/text-to-image-lora', provider: 'wavespeed' },
  
  // Hunyuan
  'hunyuan-image-2.1': { api: 'wavespeed-ai/hunyuan-image-2.1', provider: 'wavespeed' },
  'hunyuan-image-3': { api: 'wavespeed-ai/hunyuan-image-3', provider: 'wavespeed' },
  
  // Z-Image
  'z-image-turbo': { api: 'wavespeed-ai/z-image/turbo', provider: 'wavespeed' },
  'z-image-turbo-lora': { api: 'wavespeed-ai/z-image/turbo-lora', provider: 'wavespeed' },
  
  // HiDream
  'hidream-i1-dev': { api: 'wavespeed-ai/hidream-i1-dev', provider: 'wavespeed' },
  'hidream-i1-full': { api: 'wavespeed-ai/hidream-i1-full', provider: 'wavespeed' },
  
  // Other WaveSpeed Models
  'chroma': { api: 'wavespeed-ai/chroma', provider: 'wavespeed' },
  'female-human': { api: 'wavespeed-ai/female-human', provider: 'wavespeed' },
  'step1x-edit': { api: 'wavespeed-ai/step1x-edit', provider: 'wavespeed', requiresInputImage: true },
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
    
    // Skip image-to-image models for text-to-image requests
    if (modelConfig?.requiresInputImage) {
      console.log(`Skipping ${model} - requires input image for image-to-image generation`);
      return new Response(
        JSON.stringify({ 
          error: `${model} is an image-to-image model and requires an input image. Currently only text-to-image generation is supported.`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
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
      const requestId = submitData.data?.id;
      
      if (!requestId) {
        console.error('Wavespeed response missing data.id:', submitData);
        throw new Error('Wavespeed API error: invalid response format');
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
        const status = resultData.data?.status;
        const outputs = resultData.data?.outputs;
        const errorMessage = resultData.data?.error;
        console.log(`Wavespeed status (attempt ${attempt + 1}):`, status);
        
        // Check if generation is complete
        if (status === 'completed' && Array.isArray(outputs) && outputs.length > 0) {
          imageUrl = outputs[0];
          console.log('Image generated successfully with Wavespeed');
          break;
        } else if (status === 'failed') {
          throw new Error(`Wavespeed generation failed: ${errorMessage || 'Unknown error'}`);
        }
        // Continue polling if status is 'processing' or 'created'
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
