import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageRequest {
  prompt: string;
  provider?: string;
  model?: string;
  sourceImage?: string; // URL of source image for image-to-image
  width?: number;
  height?: number;
  size?: string; // Natural language size like "portrait", "landscape", "wide", "square"
}

// Available dimensions for each model (width x height)
const AVAILABLE_SIZES = [
  { w: 512, h: 512 },
  { w: 768, h: 768 },
  { w: 1024, h: 1024 },
  { w: 1280, h: 720 },
  { w: 720, h: 1280 },
  { w: 1920, h: 1080 },
  { w: 1080, h: 1920 },
  { w: 1536, h: 1024 },
  { w: 1024, h: 1536 },
];

// Parse natural language size descriptions into dimensions
const parseSizeDescription = (sizeStr?: string): { w: number; h: number } | null => {
  if (!sizeStr) return null;
  
  const s = sizeStr.toLowerCase().trim();
  
  // Check for explicit dimensions like "1920x1080" or "1920*1080"
  const dimMatch = s.match(/(\d+)\s*[x*×]\s*(\d+)/i);
  if (dimMatch) {
    return { w: parseInt(dimMatch[1]), h: parseInt(dimMatch[2]) };
  }
  
  // Portrait orientations (taller than wide)
  if (/portrait|vertical|tall|story|stories|reel|reels|tiktok|mobile|phone|9:16|9\/16/.test(s)) {
    if (/full|hd|1080|high/.test(s)) return { w: 1080, h: 1920 };
    return { w: 720, h: 1280 };
  }
  
  // Landscape orientations (wider than tall)
  if (/landscape|horizontal|wide|widescreen|cinema|cinematic|movie|film|banner|youtube|thumbnail|16:9|16\/9/.test(s)) {
    if (/full|hd|1080|high|4k|ultra/.test(s)) return { w: 1920, h: 1080 };
    return { w: 1280, h: 720 };
  }
  
  // Square
  if (/square|1:1|1\/1|instagram|insta|profile|avatar|icon/.test(s)) {
    if (/small|tiny|mini/.test(s)) return { w: 512, h: 512 };
    if (/medium|mid/.test(s)) return { w: 768, h: 768 };
    return { w: 1024, h: 1024 };
  }
  
  // Photo/print ratios
  if (/3:2|3\/2|photo|print|dslr/.test(s)) {
    return { w: 1536, h: 1024 };
  }
  if (/2:3|2\/3/.test(s)) {
    return { w: 1024, h: 1536 };
  }
  
  // Size qualifiers without orientation
  if (/4k|ultra|uhd|large|big|huge|max/.test(s)) {
    return { w: 1920, h: 1080 };
  }
  if (/hd|1080p|full/.test(s)) {
    return { w: 1920, h: 1080 };
  }
  if (/720p|small|compact/.test(s)) {
    return { w: 1280, h: 720 };
  }
  if (/tiny|mini|thumb|thumbnail/.test(s) && !/youtube/.test(s)) {
    return { w: 512, h: 512 };
  }
  
  // Desktop/wallpaper
  if (/desktop|wallpaper|background|screen/.test(s)) {
    return { w: 1920, h: 1080 };
  }
  
  // Social media specific
  if (/twitter|x\s+post|tweet/.test(s)) {
    return { w: 1280, h: 720 };
  }
  if (/facebook|fb/.test(s)) {
    return { w: 1200, h: 630 }; // Will map to closest
  }
  if (/pinterest|pin/.test(s)) {
    return { w: 1024, h: 1536 };
  }
  
  return null;
};

// Find closest available size to requested dimensions
const getClosestSize = (width?: number, height?: number, sizeStr?: string): { w: number; h: number } => {
  // First try to parse natural language size
  const parsedSize = parseSizeDescription(sizeStr);
  
  const targetW = parsedSize?.w || width;
  const targetH = parsedSize?.h || height;
  
  if (!targetW || !targetH) {
    return { w: 1024, h: 1024 }; // Default 1:1
  }
  
  let closest = AVAILABLE_SIZES[0];
  let minDiff = Infinity;
  
  for (const size of AVAILABLE_SIZES) {
    const diff = Math.abs(size.w - targetW) + Math.abs(size.h - targetH);
    if (diff < minDiff) {
      minDiff = diff;
      closest = size;
    }
  }
  
  return closest;
};

// Get aspect ratio string from dimensions
const getAspectRatio = (w: number, h: number): string => {
  if (w === h) return '1:1';
  if (w === 1280 && h === 720) return '16:9';
  if (w === 720 && h === 1280) return '9:16';
  if (w === 1920 && h === 1080) return '16:9';
  if (w === 1080 && h === 1920) return '9:16';
  if (w === 1536 && h === 1024) return '3:2';
  if (w === 1024 && h === 1536) return '2:3';
  return '1:1';
};

// Fixed list of 7 image models with their Wavespeed API paths
const TEXT_TO_IMAGE_MAPPING: Record<string, string> = {
  'vidu-q2': 'vidu/text-to-image-q2',
  'wan-2.6': 'alibaba/wan-2.6/text-to-image',
  'nano-banana-pro': 'google/nano-banana-pro/text-to-image',
  'gpt-image-1.5': 'openai/gpt-image-1.5/text-to-image',
  'minimax-image-01': 'minimax/image-01/text-to-image',
  'qwen-image': 'wavespeed-ai/qwen-image/text-to-image',
  'grok-imagine': 'x-ai/grok-imagine-image/text-to-image',
  'seedream-v4.5': 'bytedance/seedream-v4.5', // Fallback model
};

// Image editing model mappings - models with actual editing endpoints
const IMAGE_EDIT_MAPPING: Record<string, string> = {
  'vidu-q2': 'vidu/reference-to-image-q2',
  'nano-banana-pro': 'google/nano-banana-pro/edit',
  'wan-2.6': 'alibaba/wan-2.6/image-edit',
  'grok-imagine': 'x-ai/grok-imagine-image/edit',
  'gpt-image-1.5': 'openai/gpt-image-1.5/edit',
  'minimax-image-01': 'minimax/image-01/image-to-image',
  'qwen-image': 'wavespeed-ai/qwen-image/edit-2511',
  'seedream-v4.5': 'bytedance/seedream-v4.5/edit', // Fallback model
};

// Fallback mappings: if a model fails, try this one instead
const FALLBACK_MODEL: Record<string, string> = {
  'nano-banana-pro': 'seedream-v4.5',
};

// Model-specific request body configurations - supports custom dimensions
const getTextToImageBody = (modelKey: string, prompt: string, size: { w: number; h: number }) => {
  const aspectRatio = getAspectRatio(size.w, size.h);
  const sizeStr = `${size.w}*${size.h}`;
  
  switch (modelKey) {
    case 'vidu-q2':
      return {
        prompt,
        aspect_ratio: aspectRatio,
        resolution: '1080p',
        seed: -1,
      };
    case 'grok-imagine':
      return {
        prompt,
        aspect_ratio: aspectRatio,
        num_images: 1,
        enable_sync_mode: false,
        enable_base64_output: false,
      };
    case 'nano-banana-pro':
      return {
        prompt,
        aspect_ratio: aspectRatio,
        resolution: '1k',
        output_format: 'png',
        enable_sync_mode: true,
        enable_base64_output: false,
      };
    case 'gpt-image-1.5':
      return {
        prompt,
        aspect_ratio: aspectRatio,
        size: sizeStr,
        quality: 'medium',
        output_format: 'jpeg',
        enable_sync_mode: true,
        enable_base64_output: false,
      };
    case 'minimax-image-01':
      return {
        prompt,
        aspect_ratio: aspectRatio,
        size: sizeStr,
        num_images: 1,
        prompt_optimizer: false,
        enable_sync_mode: true,
        enable_base64_output: false,
      };
    case 'qwen-image':
      return {
        prompt,
        aspect_ratio: aspectRatio,
        size: sizeStr,
        seed: -1,
        output_format: 'jpeg',
        enable_sync_mode: true,
        enable_base64_output: false,
      };
    case 'wan-2.6':
      return {
        prompt,
        aspect_ratio: aspectRatio,
        size: sizeStr,
        enable_prompt_expansion: false,
        seed: -1,
        enable_sync_mode: true,
      };
    case 'seedream-v4.5':
      return {
        prompt,
        size: sizeStr,
        enable_sync_mode: false,
        enable_base64_output: false,
      };
    default:
      return {
        prompt,
        aspect_ratio: aspectRatio,
        size: sizeStr,
        enable_sync_mode: true,
      };
  }
};

// Image editing request body configurations - only for models with edit support
const getImageEditBody = (modelKey: string, prompt: string, sourceImage: string) => {
  switch (modelKey) {
    case 'vidu-q2':
      return {
        prompt,
        images: [sourceImage],
        aspect_ratio: '1:1',
        resolution: '1080p',
        seed: -1,
      };
    case 'nano-banana-pro':
      return {
        prompt,
        images: [sourceImage],
        resolution: '1k',
        output_format: 'png',
        enable_sync_mode: true,
        enable_base64_output: false,
      };
    case 'wan-2.6':
      return {
        prompt,
        images: [sourceImage],
        enable_prompt_expansion: false,
        seed: -1,
        enable_sync_mode: true,
      };
    case 'grok-imagine':
      return {
        prompt,
        image: sourceImage,
        enable_sync_mode: false,
        enable_base64_output: false,
      };
    case 'gpt-image-1.5':
      return {
        prompt,
        images: [sourceImage],
        size: '1024*1024',
        quality: 'medium',
        input_fidelity: 'high',
        output_format: 'jpeg',
        enable_sync_mode: false,
        enable_base64_output: false,
      };
    case 'minimax-image-01':
      return {
        prompt,
        image: sourceImage, // Uses single image string
        size: '1024*1024',
        num_images: 1,
        prompt_optimizer: false,
        enable_sync_mode: false,
        enable_base64_output: false,
      };
    case 'qwen-image':
      return {
        prompt,
        images: [sourceImage],
        output_format: 'jpeg',
        seed: -1,
        enable_sync_mode: false,
        enable_base64_output: false,
      };
    case 'seedream-v4.5':
      return {
        prompt,
        images: [sourceImage],
        enable_sync_mode: false,
        enable_base64_output: false,
      };
    default:
      return {
        prompt,
        images: [sourceImage],
        enable_sync_mode: true,
        enable_base64_output: false,
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

// Core image generation function - returns imageUrl or throws error
async function generateImage(
  modelKey: string,
  prompt: string,
  size: { w: number; h: number },
  sourceImage: string | undefined,
  wavespeedApiKey: string
): Promise<{ imageUrl: string; usedModel: string }> {
  const hasSourceImage = !!sourceImage;
  
  const textToImagePath = TEXT_TO_IMAGE_MAPPING[modelKey];
  if (!textToImagePath) {
    throw new Error(`Unknown model: ${modelKey}`);
  }
  
  const editPath = hasSourceImage ? IMAGE_EDIT_MAPPING[modelKey] : null;
  const useEditMode = hasSourceImage && editPath;
  const finalApiPath = useEditMode ? editPath : textToImagePath;
  
  console.log(`[${modelKey}] Using path:`, finalApiPath, useEditMode ? '(image-edit)' : '(text-to-image)');
  
  const requestBody = useEditMode
    ? getImageEditBody(modelKey, prompt, sourceImage!)
    : getTextToImageBody(modelKey, prompt, size);
  
  console.log(`[${modelKey}] Request body:`, JSON.stringify(requestBody));
  
  const apiUrl = `https://api.wavespeed.ai/api/v3/${finalApiPath}`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${wavespeedApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
  
  const responseText = await response.text();
  console.log(`[${modelKey}] Response status:`, response.status);
  console.log(`[${modelKey}] Response:`, responseText);
  
  if (!response.ok) {
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
  let imageUrl: string | null = null;
  
  // Sync mode: outputs directly in response
  if (data.data?.outputs && data.data.outputs.length > 0) {
    imageUrl = data.data.outputs[0];
  }
  // Check for immediate failure in response
  else if (data.data?.status === 'failed') {
    const errorMsg = data.data?.error || 'Image generation failed';
    throw new Error(errorMsg);
  }
  // Async mode: need to poll for result
  else if (data.data?.id) {
    const taskId = data.data.id;
    console.log(`[${modelKey}] Got task ID, polling:`, taskId);
    
    const timeoutConfig = getModelTimeoutConfig(modelKey);
    for (let attempt = 0; attempt < timeoutConfig.maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, timeoutConfig.interval));
      
      const resultResponse = await fetch(
        `https://api.wavespeed.ai/api/v3/predictions/${taskId}/result`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${wavespeedApiKey}` }
        }
      );
      
      const resultText = await resultResponse.text();
      console.log(`[${modelKey}] Poll ${attempt + 1}:`, resultText);
      
      if (!resultResponse.ok) continue;
      
      const resultData = JSON.parse(resultText);
      
      if (resultData.data?.status === 'completed' && resultData.data?.outputs?.length > 0) {
        imageUrl = resultData.data.outputs[0];
        break;
      } else if (resultData.data?.status === 'failed') {
        const errorMsg = resultData.data?.error || 'Image generation failed';
        throw new Error(errorMsg);
      }
    }
    
    if (!imageUrl) {
      throw new Error(`Timeout: ${modelKey} took too long`);
    }
  }
  
  if (!imageUrl) {
    throw new Error('No image returned from API');
  }
  
  console.log(`[${modelKey}] Final image URL:`, imageUrl);
  return { imageUrl, usedModel: modelKey };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model, sourceImage, width, height, size: sizeStr }: ImageRequest = await req.json();
    
    const hasSourceImage = !!sourceImage;
    const size = getClosestSize(width, height, sizeStr);
    
    console.log('Image generation request:', { 
      prompt, 
      model, 
      hasSourceImage,
      requestedSize: sizeStr || (width && height ? `${width}x${height}` : 'default'),
      resolvedSize: `${size.w}x${size.h}`,
      sourceImage: sourceImage ? sourceImage.substring(0, 50) + '...' : null 
    });
    
    const modelKey = model?.toLowerCase().replace(/\s+/g, '-') || 'nano-banana-pro';
    
    // Check if model exists
    if (!TEXT_TO_IMAGE_MAPPING[modelKey]) {
      console.error(`Unknown model: ${model} (key: ${modelKey})`);
      return new Response(
        JSON.stringify({ 
          error: `Unknown image model: ${model}. Available models: ${Object.keys(TEXT_TO_IMAGE_MAPPING).join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const wavespeedApiKey = Deno.env.get('WAVESPEED_API_KEY');
    if (!wavespeedApiKey) {
      throw new Error('WAVESPEED_API_KEY not configured');
    }
    
    let result: { imageUrl: string; usedModel: string };
    
    try {
      // Try primary model
      result = await generateImage(modelKey, prompt, size, sourceImage, wavespeedApiKey);
    } catch (primaryError) {
      const fallbackModelKey = FALLBACK_MODEL[modelKey];
      
      if (fallbackModelKey && TEXT_TO_IMAGE_MAPPING[fallbackModelKey]) {
        console.log(`[${modelKey}] Failed, trying fallback: ${fallbackModelKey}`);
        console.log(`[${modelKey}] Error was:`, primaryError instanceof Error ? primaryError.message : primaryError);
        
        try {
          result = await generateImage(fallbackModelKey, prompt, size, sourceImage, wavespeedApiKey);
          console.log(`[${fallbackModelKey}] Fallback succeeded`);
        } catch (fallbackError) {
          console.error(`[${fallbackModelKey}] Fallback also failed:`, fallbackError);
          // Re-throw the original error since both failed
          throw primaryError;
        }
      } else {
        // No fallback available, re-throw
        throw primaryError;
      }
    }
    
    return new Response(
      JSON.stringify({
        imageUrl: result.imageUrl,
        revisedPrompt: prompt,
        model: result.usedModel === modelKey ? (model || 'Nano Banana Pro') : `${result.usedModel} (fallback)`,
        isImageEdit: !!sourceImage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
