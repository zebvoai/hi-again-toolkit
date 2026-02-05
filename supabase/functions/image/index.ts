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

// Fixed list of 7 image models with their Wavespeed API paths
const IMAGE_MODEL_MAPPING: Record<string, string> = {
  'vidu-q2': 'vidu/text-to-image-q2',
  'wan-2.6': 'alibaba/wan-2.6/text-to-image',
  'nano-banana-pro': 'google/nano-banana-pro/text-to-image',
  'gpt-image-1.5': 'openai/gpt-image-1.5/text-to-image',
  'minimax-image-01': 'minimax/image-01/text-to-image',
  'qwen-image': 'wavespeed-ai/qwen-image/text-to-image',
  'grok-imagine': 'x-ai/grok-imagine-image/text-to-image',
};

// Model-specific request body configurations - ALL use 1:1 square aspect ratio
const getRequestBody = (modelKey: string, prompt: string) => {
  switch (modelKey) {
    case 'vidu-q2':
      return {
        prompt,
        aspect_ratio: '1:1',
        resolution: '1080p',
        seed: -1,
      };
    case 'grok-imagine':
      return {
        prompt,
        aspect_ratio: '1:1',
        num_images: 1,
        enable_sync_mode: false,
        enable_base64_output: false,
      };
    case 'nano-banana-pro':
      return {
        prompt,
        aspect_ratio: '1:1',
        resolution: '1k',
        output_format: 'png',
        enable_sync_mode: true,
        enable_base64_output: false,
      };
    case 'gpt-image-1.5':
      return {
        prompt,
        aspect_ratio: '1:1',
        size: '1024*1024',
        quality: 'medium',
        output_format: 'jpeg',
        enable_sync_mode: true,
        enable_base64_output: false,
      };
    case 'minimax-image-01':
      return {
        prompt,
        aspect_ratio: '1:1',
        size: '1024*1024',
        num_images: 1,
        prompt_optimizer: false,
        enable_sync_mode: true,
        enable_base64_output: false,
      };
    case 'qwen-image':
      return {
        prompt,
        aspect_ratio: '1:1',
        size: '1024*1024',
        seed: -1,
        output_format: 'jpeg',
        enable_sync_mode: true,
        enable_base64_output: false,
      };
    case 'wan-2.6':
      return {
        prompt,
        aspect_ratio: '1:1',
        size: '1024*1024',
        enable_prompt_expansion: false,
        seed: -1,
        enable_sync_mode: true,
      };
    default:
      return {
        prompt,
        aspect_ratio: '1:1',
        size: '1024*1024',
        enable_sync_mode: true,
      };
  }
};

// Get timeout config for each model - some are slower than others
const getModelTimeoutConfig = (modelKey: string): { maxAttempts: number; interval: number } => {
  switch (modelKey) {
    case 'vidu-q2':
      // Vidu is very slow - allow up to 3 minutes
      return { maxAttempts: 90, interval: 2000 };
    case 'grok-imagine':
      // Grok can also be slow
      return { maxAttempts: 75, interval: 2000 };
    default:
      // Default: 2 minutes
      return { maxAttempts: 60, interval: 2000 };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model }: ImageRequest = await req.json();
    
    console.log('Image generation request:', { prompt, model });
    
    // Map display name to API model path
    const modelKey = model?.toLowerCase().replace(/\s+/g, '-') || 'nano-banana-pro';
    const apiModelPath = IMAGE_MODEL_MAPPING[modelKey];
    
    if (!apiModelPath) {
      console.error(`Unknown model: ${model} (key: ${modelKey})`);
      return new Response(
        JSON.stringify({ 
          error: `Unknown image model: ${model}. Available models: ${Object.keys(IMAGE_MODEL_MAPPING).join(', ')}`
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Using Wavespeed model path:', apiModelPath);
    
    const wavespeedApiKey = Deno.env.get('WAVESPEED_API_KEY');
    
    if (!wavespeedApiKey) {
      throw new Error('WAVESPEED_API_KEY not configured');
    }
    
    // Call Wavespeed API for image generation
    const apiUrl = `https://api.wavespeed.ai/api/v3/${apiModelPath}`;
    console.log('Calling Wavespeed API:', apiUrl);
    
    const requestBody = getRequestBody(modelKey, prompt);
    console.log('Request body:', JSON.stringify(requestBody));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wavespeedApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await response.text();
    console.log('Wavespeed response status:', response.status);
    console.log('Wavespeed response:', responseText);
    
    if (!response.ok) {
      console.error('Wavespeed image error:', response.status, responseText);
      
      let errorMessage = `Image generation failed (${response.status})`;
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        // Use default error message
      }
      
      throw new Error(errorMessage);
    }
    
    const data = JSON.parse(responseText);
    console.log('Image generation response:', JSON.stringify(data));
    
    // Extract image URL from response
    let imageUrl: string | null = null;
    
    // Sync mode: outputs directly in response
    if (data.data?.outputs && data.data.outputs.length > 0) {
      imageUrl = data.data.outputs[0];
    }
    // Async mode: need to poll for result
    else if (data.data?.id) {
      const taskId = data.data.id;
      console.log('Got task ID, polling for result:', taskId);
      
      // Poll for result with model-specific timeout
      const timeoutConfig = getModelTimeoutConfig(modelKey);
      const maxAttempts = timeoutConfig.maxAttempts;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, timeoutConfig.interval));
        
        const resultResponse = await fetch(
          `https://api.wavespeed.ai/api/v3/predictions/${taskId}/result`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${wavespeedApiKey}`,
            }
          }
        );
        
        const resultText = await resultResponse.text();
        console.log(`Poll attempt ${attempt + 1}:`, resultText);
        
        if (!resultResponse.ok) {
          continue;
        }
        
        const resultData = JSON.parse(resultText);
        
        if (resultData.data?.status === 'completed' && resultData.data?.outputs?.length > 0) {
          imageUrl = resultData.data.outputs[0];
          break;
        } else if (resultData.data?.status === 'failed') {
          const errorMsg = resultData.data?.error || 'Image generation failed';
          throw new Error(errorMsg);
        }
      }
      
      // If we exhausted all attempts without getting an image
      if (!imageUrl) {
        console.error('Polling timeout - model still processing after max attempts');
        return new Response(
          JSON.stringify({ 
            error: `Image generation timed out. The ${model || 'selected'} model is taking longer than expected. Please try again or select a different model.`,
            errorCode: 'timeout'
          }),
          { 
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }
    
    if (!imageUrl) {
      console.error('No image URL in response:', data);
      return new Response(
        JSON.stringify({ 
          error: 'No image returned from API. The model may be experiencing issues. Please try a different model.',
          errorCode: 'no_output'
        }),
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Final image URL:', imageUrl);
    
    return new Response(
      JSON.stringify({
        imageUrl,
        revisedPrompt: prompt,
        model: model || 'Nano Banana Pro'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
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
