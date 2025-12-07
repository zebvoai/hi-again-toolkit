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

// Map frontend model names to API model names
const modelMapping: Record<string, { api: string; provider: 'google' | 'wavespeed' | 'vidu' }> = {
  'gemini-video-2.0': { api: 'gemini-2.0-flash-exp', provider: 'google' },
  'gemini-video-flash': { api: 'gemini-2.0-flash-exp', provider: 'google' },
  
  // Alibaba WAN Models
  'wan-2.1-t2v-480p': { api: 'alibaba/wan-2.1-t2v-480p', provider: 'wavespeed' },
  'wan-2.1-t2v-720p': { api: 'alibaba/wan-2.1-t2v-720p', provider: 'wavespeed' },
  'wan-2.2-plus-t2v': { api: 'alibaba/wan-2.2-plus-t2v', provider: 'wavespeed' },
  
  // Vidu Text-to-Video Model
  'vidu-t2v': { api: 'vidu/text-to-video', provider: 'vidu' },
  'vidu-text-to-video': { api: 'vidu/text-to-video', provider: 'vidu' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model = 'gemini-2.0-flash-exp', provider } = await req.json() as VideoRequest;
    
    console.log('Video generation request:', { prompt, model, provider });

    // Determine the actual provider and model to use
    const modelKey = model.toLowerCase().replace(/\s+/g, '-');
    const modelConfig = modelMapping[modelKey];
    
    const actualProvider = modelConfig?.provider || 'google';
    const actualModel = modelConfig?.api || 'gemini-2.0-flash-exp';
    
    console.log('Using provider:', actualProvider, 'model:', actualModel);

    // Use Google API for Gemini models
    if (actualProvider === 'google') {
      const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
      
      if (!googleApiKey) {
        console.error('GOOGLE_API_KEY not configured');
        return new Response(
          JSON.stringify({ 
            error: 'Video generation requires API configuration. Please contact support.' 
          }),
          { 
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Generate video using Google's Generative AI API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate a video: ${prompt}`
              }]
            }],
            generationConfig: {
              temperature: 1,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google API error:', response.status, errorText);
        
        // Check if video generation is not supported
        if (errorText.includes('not supported') || errorText.includes('modality') || errorText.includes('video')) {
          return new Response(
            JSON.stringify({ 
              error: 'Video generation is not yet available with the current API. This feature is still in development by the provider. Please try image generation instead.' 
            }),
            { 
              status: 503,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            error: `Google API error: ${errorText}` 
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const data = await response.json();
      console.log('Google API response:', JSON.stringify(data).substring(0, 200));

      // Extract video data from response
      const videoData = data.candidates?.[0]?.content?.parts?.[0];
      
      if (videoData?.inlineData?.mimeType?.startsWith('video/')) {
        // Return base64 encoded video
        const videoUrl = `data:${videoData.inlineData.mimeType};base64,${videoData.inlineData.data}`;
        
        return new Response(
          JSON.stringify({ 
            videoUrl,
            model: model
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // If no video was generated, return error
      return new Response(
        JSON.stringify({ 
          error: 'Video generation is not currently supported by this API. The provider has not yet enabled video generation capabilities. Please try image generation as an alternative.',
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use Wavespeed for WAN video models
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
          duration: 5, // 5 second video
          num_videos: 1,
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
      
      console.log('Wavespeed video task submitted:', requestId);
      
      // Poll for results (max 5 minutes for video generation)
      let videoUrl = null;
      const maxAttempts = 300; // 5 minutes
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
          videoUrl = outputs[0];
          console.log('Video generated successfully with Wavespeed');
          console.log('Video URL:', videoUrl);
          break;
        } else if (status === 'failed') {
          throw new Error(`Wavespeed generation failed: ${errorMessage || 'Unknown error'}`);
        }
        // Continue polling if status is 'processing' or 'created'
      }
      
      if (!videoUrl) {
        throw new Error('Video generation timed out after 5 minutes');
      }
      
      return new Response(
        JSON.stringify({
          videoUrl,
          model: model
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use Vidu API for Vidu models
    if (actualProvider === 'vidu') {
      const wavespeedApiKey = Deno.env.get('WAVESPEED_API_KEY');
      
      if (!wavespeedApiKey) {
        throw new Error('WAVESPEED_API_KEY not configured for Vidu');
      }
      
      console.log('Submitting Vidu text-to-video request...');
      
      // Submit the video generation request to Vidu API
      const submitResponse = await fetch('https://api.wavespeed.ai/api/v3/vidu/text-to-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wavespeedApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movement_amplitude: 'auto',
          prompt: prompt
        })
      });
      
      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Vidu submit error:', submitResponse.status, errorText);
        throw new Error(`Vidu API error: ${submitResponse.status} - ${errorText}`);
      }
      
      const submitData = await submitResponse.json();
      const requestId = submitData.data?.id || submitData.requestId;
      
      if (!requestId) {
        console.error('Vidu response missing requestId:', submitData);
        throw new Error('Vidu API error: invalid response format - missing requestId');
      }
      
      console.log('Vidu video task submitted with requestId:', requestId);
      
      // Poll for results every 3 seconds (max 5 minutes)
      let videoUrl = null;
      const maxAttempts = 100; // 5 minutes at 3-second intervals
      const pollInterval = 3000; // 3 seconds
      
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
          console.error(`Vidu poll error (attempt ${attempt + 1}):`, resultResponse.status, errorText);
          continue;
        }
        
        const resultData = await resultResponse.json();
        const status = resultData.data?.status || resultData.status;
        const outputs = resultData.data?.outputs || resultData.outputs;
        const video_url = resultData.data?.video_url || resultData.video_url;
        const errorMessage = resultData.data?.error || resultData.error;
        
        console.log(`Vidu status (attempt ${attempt + 1}):`, status, 'outputs:', outputs, 'video_url:', video_url);
        
        // Check if generation is complete
        if (status === 'succeeded' || status === 'completed') {
          // Try different response formats
          if (video_url) {
            videoUrl = video_url;
          } else if (Array.isArray(outputs) && outputs.length > 0) {
            videoUrl = outputs[0];
          } else if (typeof outputs === 'string') {
            videoUrl = outputs;
          }
          
          if (videoUrl) {
            console.log('Vidu video generated successfully');
            console.log('Video URL:', videoUrl);
            break;
          }
        } else if (status === 'failed' || status === 'error') {
          throw new Error(`Vidu generation failed: ${errorMessage || 'Unknown error'}`);
        }
        // Continue polling if status is 'processing', 'pending', 'created', etc.
      }
      
      if (!videoUrl) {
        throw new Error('Vidu video generation timed out after 5 minutes');
      }
      
      return new Response(
        JSON.stringify({
          videoUrl,
          model: model
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    throw new Error('Provider not supported for video generation');

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
