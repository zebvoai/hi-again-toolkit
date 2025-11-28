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
    const { prompt, model = 'gemini-2.0-flash-exp', provider } = await req.json() as VideoRequest;
    
    console.log('Video generation request:', { prompt, model, provider });

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

    // Map frontend model names to Google API model names
    let apiModel = 'gemini-2.0-flash-exp';
    const modelLower = model.toLowerCase();
    
    if (modelLower.includes('gemini-2.0') || modelLower.includes('gemini-video')) {
      apiModel = 'gemini-2.0-flash-exp';
    }

    console.log('Using Google Gemini API model:', apiModel);

    // Generate video using Google's Generative AI API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${googleApiKey}`,
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
    // Note: The actual response format may vary based on Google's implementation
    const videoData = data.candidates?.[0]?.content?.parts?.[0];
    
    if (videoData?.inlineData?.mimeType?.startsWith('video/')) {
      // Return base64 encoded video
      const videoUrl = `data:${videoData.inlineData.mimeType};base64,${videoData.inlineData.data}`;
      
      return new Response(
        JSON.stringify({ 
          videoUrl,
          model: apiModel
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