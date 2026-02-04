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

// Fixed list of 7 image models with their OpenRouter API IDs
const IMAGE_MODEL_MAPPING: Record<string, string> = {
  'vidu-q2': 'vidu/text-to-image-q2',
  'wan-2.6': 'alibaba/wan-2.6/text-to-image',
  'nano-banana-pro': 'google/nano-banana-pro/text-to-image',
  'gpt-image-1.5': 'openai/gpt-image-1.5/text-to-image',
  'minimax-image-01': 'minimax/image-01/text-to-image',
  'qwen-image': 'wavespeed-ai/qwen-image/text-to-image',
  'grok-imagine': 'x-ai/grok-imagine-image/text-to-image',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model }: ImageRequest = await req.json();
    
    console.log('Image generation request:', { prompt, model });
    
    // Map display name to API model ID
    const modelKey = model?.toLowerCase().replace(/\s+/g, '-') || 'nano-banana-pro';
    const apiModelId = IMAGE_MODEL_MAPPING[modelKey];
    
    if (!apiModelId) {
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
    
    console.log('Using OpenRouter model:', apiModelId);
    
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    
    // Call OpenRouter for image generation
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Zebvo AI'
      },
      body: JSON.stringify({
        model: apiModelId,
        prompt,
        n: 1,
        size: '1024x1024'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter image error:', response.status, errorText);
      
      // Try to parse error for better messaging
      let errorMessage = `Image generation failed (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        // Use default error message
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Image generated successfully via OpenRouter');
    
    // OpenRouter returns image URL in data array
    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;
    
    if (!imageUrl) {
      console.error('No image URL in response:', data);
      throw new Error('No image returned from API');
    }
    
    // If it's base64, convert to data URL
    const finalUrl = imageUrl.startsWith('data:') || imageUrl.startsWith('http') 
      ? imageUrl 
      : `data:image/png;base64,${imageUrl}`;
    
    return new Response(
      JSON.stringify({
        imageUrl: finalUrl,
        revisedPrompt: data.data?.[0]?.revised_prompt || prompt,
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
