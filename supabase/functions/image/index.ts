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
// Format: display name key -> Wavespeed API model path
const IMAGE_MODEL_MAPPING: Record<string, string> = {
  'vidu-q2': 'vidu/text-to-image-q2',
  'wan-2.6': 'alibaba/wan-2.6/text-to-image',
  'nano-banana-pro': 'google/nano-banana-pro/text-to-image',
  'gpt-image-1.5': 'openai/gpt-image-1.5/text-to-image',
  'minimax-image-01': 'minimax/image-01/text-to-image',
  'qwen-image': 'wavespeed-ai/qwen-image/text-to-image',
  'grok-2-image': 'x-ai/grok-2-image',
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
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${wavespeedApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        size: '1024*1024',
        enable_sync_mode: true,
      })
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
      
      // Poll for result (max 60 seconds)
      const maxAttempts = 30;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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
          throw new Error('Image generation failed');
        }
      }
    }
    
    if (!imageUrl) {
      console.error('No image URL in response:', data);
      throw new Error('No image returned from API');
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
