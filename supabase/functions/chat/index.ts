import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

// Model mapping helper - FIXED: Claude models use anthropic directly, Gemini uses lovable gateway
const getModelMapping = (displayName: string): { apiModel: string, provider: string } => {
  const modelMapping: Record<string, { apiModel: string, provider: string }> = {
    // OpenAI Models
    'GPT-5': { apiModel: 'gpt-5-2025-08-07', provider: 'openai' },
    'GPT-5 Mini': { apiModel: 'gpt-5-mini-2025-08-07', provider: 'openai' },
    'GPT-5 Nano': { apiModel: 'gpt-5-nano-2025-08-07', provider: 'openai' },
    'GPT-4.1': { apiModel: 'gpt-4.1-2025-04-14', provider: 'openai' },
    'GPT-4.1 Mini': { apiModel: 'gpt-4.1-mini-2025-04-14', provider: 'openai' },
    'O3': { apiModel: 'o3-2025-04-16', provider: 'openai' },
    'O4 Mini': { apiModel: 'o4-mini-2025-04-16', provider: 'openai' },
    
    // Anthropic Models - ALL Claude models use anthropic provider directly
    'Claude Sonnet 4.5': { apiModel: 'claude-sonnet-4-5', provider: 'anthropic' },
    'Claude Opus 4.1': { apiModel: 'claude-opus-4-1-20250805', provider: 'anthropic' },
    'Claude Sonnet 4': { apiModel: 'claude-sonnet-4-20250514', provider: 'anthropic' },
    'Claude Opus 4': { apiModel: 'claude-opus-4', provider: 'anthropic' },
    'Claude 3.7 Sonnet': { apiModel: 'claude-3-7-sonnet-20250219', provider: 'anthropic' },
    'Claude Haiku 3.5': { apiModel: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
    'Claude Sonnet 3.5': { apiModel: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
    'Claude 3.5 Haiku': { apiModel: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
    
    // Google Models - ALL Gemini models use lovable gateway (avoids quota issues)
    'Gemini 2.5 Pro': { apiModel: 'google/gemini-2.5-pro', provider: 'lovable' },
    'Gemini 3 Pro': { apiModel: 'google/gemini-3-pro-preview', provider: 'lovable' },
    'Gemini 2.5 Flash': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' },
    'Gemini 2.5 Flash Lite': { apiModel: 'google/gemini-2.5-flash-lite', provider: 'lovable' },
    'Gemini 2.0 Flash': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' }, // Map to 2.5 flash as fallback
    
    // OpenRouter Models
    'Qwen: Qwen Plus 0728': { apiModel: 'qwen/qwen-plus-2025-07-28', provider: 'openrouter' },
    'Qwen: Qwen Plus 0728 (thinking)': { apiModel: 'qwen/qwen-plus-2025-07-28:thinking', provider: 'openrouter' },
    'OpenAI: o3 Mini High': { apiModel: 'openai/o3-mini-high', provider: 'openrouter' },
    'OpenAI: o3 Mini': { apiModel: 'openai/o3-mini', provider: 'openrouter' },
    'Cohere: Command R7B (12-2024)': { apiModel: 'cohere/command-r7b-12-2024', provider: 'openrouter' },
    'Cohere: Command R+ (08-2024)': { apiModel: 'cohere/command-r-plus-08-2024', provider: 'openrouter' },
    'Cohere: Command R (08-2024)': { apiModel: 'cohere/command-r-08-2024', provider: 'openrouter' },
    'OpenAI: GPT-4o Audio': { apiModel: 'openai/gpt-4o-audio-preview', provider: 'openrouter' },
    'OpenAI: GPT-4o-mini Search Preview': { apiModel: 'openai/gpt-4o-mini-search-preview', provider: 'openrouter' },
    'OpenAI: GPT-4o Search Preview': { apiModel: 'openai/gpt-4o-search-preview', provider: 'openrouter' },
    'OpenAI: GPT-4 Turbo Preview': { apiModel: 'openai/gpt-4-turbo-preview', provider: 'openrouter' },
    'OpenAI: GPT-4 Turbo (older v1106)': { apiModel: 'openai/gpt-4-1106-preview', provider: 'openrouter' },
    'Prime Intellect: INTELLECT-3': { apiModel: 'prime-intellect/intellect-3', provider: 'openrouter' },
    'TNG: R1T Chimera': { apiModel: 'tng/r1t-chimera', provider: 'openrouter' },
    'TNG: R1T Chimera (free)': { apiModel: 'tng/r1t-chimera:free', provider: 'openrouter' },
    'MoonshotAI: Kimi Linear 48B A3B Instruct': { apiModel: 'moonshotai/kimi-linear-48b-a3b-instruct', provider: 'openrouter' },
    'MoonshotAI: Kimi K2 Thinking': { apiModel: 'moonshotai/kimi-k2-thinking', provider: 'openrouter' },
    'OpenAI: gpt-oss-safeguard-20b': { apiModel: 'openai/gpt-oss-safeguard-20b', provider: 'openrouter' },
    'MiniMax: MiniMax M2': { apiModel: 'minimax/minimax-m2', provider: 'openrouter' }
  };
  
  // If not in base mappings, assume it's an OpenRouter model (use display name as model ID)
  return modelMapping[displayName] || { apiModel: displayName, provider: 'openrouter' };
};

// Multi-model request handler
async function handleMultiModelRequest(
  message: string,
  models: string[],
  conversationHistory: Message[],
  stream: boolean,
  mode: string = 'text'
): Promise<Response> {
  const encoder = new TextEncoder();
  
  if (stream) {
    const streamBody = new ReadableStream({
      async start(controller) {
        try {
          await Promise.all(models.map(async (modelName) => {
            const mapping = getModelMapping(modelName);
            const { apiModel, provider } = mapping;
            
            let apiUrl = '';
            let apiKey = '';
            let headers: Record<string, string> = {};
            let body: any = {};
            
            // Build mode gets a code-generation system prompt
            const systemPrompt = mode === 'build' 
              ? 'You are an expert software engineer. Generate complete, production-ready code with clear explanations. Include all necessary imports, error handling, and best practices. Format code in markdown code blocks with proper language tags.'
              : 'You are a helpful AI assistant.';
            
            try {
              if (provider === 'openai') {
                apiKey = Deno.env.get('OPENAI_API_KEY') || '';
                if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
                
                apiUrl = 'https://api.openai.com/v1/chat/completions';
                headers = {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                };
                
                const messages = [
                  { role: 'system', content: systemPrompt },
                  ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content: message }
                ];
                
                body = { model: apiModel, messages, stream: true, max_completion_tokens: mode === 'build' ? 8192 : 4096 };
              } else if (provider === 'anthropic') {
                apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
                if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
                
                apiUrl = 'https://api.anthropic.com/v1/messages';
                headers = {
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01',
                  'content-type': 'application/json'
                };
                
                const messages = [
                  ...conversationHistory.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content: message }
                ];
                
                body = { 
                  model: apiModel, 
                  messages, 
                  max_tokens: mode === 'build' ? 8192 : 4096,
                  system: systemPrompt
                };
              } else if (provider === 'lovable') {
                // Lovable AI Gateway for Gemini models
                apiKey = Deno.env.get('LOVABLE_API_KEY') || '';
                if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');
                
                apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
                headers = {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                };
                
                const messages = [
                  { role: 'system', content: systemPrompt },
                  ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content: message }
                ];
                
                body = { model: apiModel, messages, stream: true };
              } else if (provider === 'google') {
                apiKey = Deno.env.get('GOOGLE_API_KEY') || '';
                if (!apiKey) throw new Error('GOOGLE_API_KEY not configured');
                
                apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:streamGenerateContent?alt=sse`;
                headers = { 
                  'Content-Type': 'application/json',
                  'x-goog-api-key': apiKey
                };
                
                const contents = conversationHistory.map(m => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }]
                }));
                contents.push({ role: 'user', parts: [{ text: message }] });
                
                body = { contents };
              } else if (provider === 'openrouter') {
                apiKey = Deno.env.get('OPENROUTER_API_KEY') || '';
                if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');
                
                console.log(`[${modelName}] Using OpenRouter API model ID: ${apiModel}`);
                
                apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
                headers = {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'https://lovable.dev',
                  'X-Title': 'Lovable AI'
                };
                
                const messages = [
                  { role: 'system', content: systemPrompt },
                  ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content: message }
                ];
                
                body = { model: apiModel, messages, stream: true, max_tokens: mode === 'build' ? 4096 : 2048 };
              } else {
                throw new Error(`Unsupported provider: ${provider}`);
              }
              
              console.log(`[${modelName}] Calling ${provider} with model ${apiModel}`);
              
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                let errorDetails;
                try {
                  errorDetails = JSON.parse(errorText);
                } catch {
                  errorDetails = { raw: errorText };
                }

                console.error(`[FAIL] ${modelName} (${provider}/${apiModel}):`, JSON.stringify({
                  status: response.status,
                  error: errorDetails
                }));

                const fallbackContent = 'The model could not generate a response at the moment. Please try again.';
                const sseData = `data: ${JSON.stringify({ model: modelName, content: fallbackContent, error: true })}\n\n`;
                controller.enqueue(encoder.encode(sseData));
                return;
              }
              
              // Handle non-streaming Anthropic responses
              if (provider === 'anthropic') {
                const data = await response.json();
                const content = data.content?.[0]?.text || 'No response generated.';
                const sseData = `data: ${JSON.stringify({ model: modelName, content })}\n\n`;
                controller.enqueue(encoder.encode(sseData));
                return;
              }
              
              const reader = response.body?.getReader();
              if (!reader) return;
              
              const decoder = new TextDecoder();
              let buffer = '';
              
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;
                    
                    try {
                      let content = '';
                      
                      if (provider === 'openai' || provider === 'openrouter' || provider === 'lovable') {
                        const parsed = JSON.parse(data);
                        content = parsed.choices?.[0]?.delta?.content || '';
                      } else if (provider === 'google') {
                        const parsed = JSON.parse(data);
                        content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                      }
                      
                      if (content) {
                        const sseData = `data: ${JSON.stringify({ model: modelName, content })}\n\n`;
                        controller.enqueue(encoder.encode(sseData));
                      }
                    } catch (e) {
                      // Skip invalid JSON
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`[ERROR] ${modelName}:`, error);
              const fallbackContent = 'The model could not generate a response at the moment. Please try again.';
              const sseData = `data: ${JSON.stringify({ model: modelName, content: fallbackContent, error: true })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          }));
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Multi-model streaming error:', error);
          controller.error(error);
        }
      }
    });
    
    return new Response(streamBody, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    });
  }
  
  // Non-streaming multi-model response
  return new Response(
    JSON.stringify({ error: 'Non-streaming multi-model not yet supported' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

interface ChatRequest {
  message: string;
  mode: 'text' | 'image' | 'video' | 'build';
  conversationHistory: Message[];
  provider?: string;
  model?: string;
  models?: string[];
  stream?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, mode, conversationHistory = [], provider, model: requestedModel, models, stream = false }: ChatRequest = await req.json();
    
    console.log('Chat request:', { message, mode, provider, requestedModel, models, historyLength: conversationHistory.length });

    // VIDEO MODE: Only process video models, ignore text models
    if (mode === 'video') {
      const videoModels = ['Runway Gen-2', 'Pika 1.0'];
      let selectedVideoModels = models?.filter(m => videoModels.includes(m)) || [];
      
      // If user selected a video model, use only that
      if (selectedVideoModels.length === 0 && requestedModel && videoModels.includes(requestedModel)) {
        selectedVideoModels = [requestedModel];
      }
      
      if (selectedVideoModels.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No video model selected. Please select Runway Gen-2 or Pika 1.0 for video generation.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Video generation request with models:', selectedVideoModels);
      
      // For now, return a message that video generation is not yet fully implemented
      // In production, this would call Runway or Pika APIs
      return new Response(
        JSON.stringify({ 
          error: 'Video generation API integration is not yet implemented. This feature requires Runway Gen-2 or Pika API keys and endpoints.' 
        }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle multi-model requests (text mode only)
    if (models && Array.isArray(models) && models.length > 1) {
      console.log('Multi-model request:', models);
      return await handleMultiModelRequest(message, models, conversationHistory, stream, mode);
    }
    
    // Map display names to actual API model names - SYNCED with getModelMapping
    const modelMapping: Record<string, { api: string, provider: string }> = {
      // OpenAI Models
      'GPT-5': { api: 'gpt-5-2025-08-07', provider: 'openai' },
      'GPT-5 Mini': { api: 'gpt-5-mini-2025-08-07', provider: 'openai' },
      'GPT-5 Nano': { api: 'gpt-5-nano-2025-08-07', provider: 'openai' },
      'GPT-4.1': { api: 'gpt-4.1-2025-04-14', provider: 'openai' },
      'GPT-4.1 Mini': { api: 'gpt-4.1-mini-2025-04-14', provider: 'openai' },
      'O3': { api: 'o3-2025-04-16', provider: 'openai' },
      'O4 Mini': { api: 'o4-mini-2025-04-16', provider: 'openai' },
      
      // Anthropic Models - ALL Claude models use anthropic provider directly
      'Claude Sonnet 4.5': { api: 'claude-sonnet-4-5', provider: 'anthropic' },
      'Claude Opus 4.1': { api: 'claude-opus-4-1-20250805', provider: 'anthropic' },
      'Claude Sonnet 4': { api: 'claude-sonnet-4-20250514', provider: 'anthropic' },
      'Claude Opus 4': { api: 'claude-opus-4', provider: 'anthropic' },
      'Claude 3.7 Sonnet': { api: 'claude-3-7-sonnet-20250219', provider: 'anthropic' },
      'Claude Haiku 3.5': { api: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
      'Claude Sonnet 3.5': { api: 'claude-3-5-sonnet-20241022', provider: 'anthropic' },
      'Claude 3.5 Haiku': { api: 'claude-3-5-haiku-20241022', provider: 'anthropic' },
      
      // Google Models - ALL Gemini models use lovable gateway
      'Gemini 2.5 Pro': { api: 'google/gemini-2.5-pro', provider: 'lovable' },
      'Gemini 3 Pro': { api: 'google/gemini-3-pro-preview', provider: 'lovable' },
      'Gemini 2.5 Flash': { api: 'google/gemini-2.5-flash', provider: 'lovable' },
      'Gemini 2.5 Flash Lite': { api: 'google/gemini-2.5-flash-lite', provider: 'lovable' },
      'Gemini 2.0 Flash': { api: 'google/gemini-2.5-flash', provider: 'lovable' }
    };
    
    // Determine actual model and provider
    let model: string;
    let selectedProvider: string;
    
    if (requestedModel && modelMapping[requestedModel]) {
      // Use the mapping for display names
      model = modelMapping[requestedModel].api;
      selectedProvider = modelMapping[requestedModel].provider;
    } else if (requestedModel) {
      // Fallback: use the model name directly (for backward compatibility)
      model = requestedModel;
      // Determine provider from model name
      if (requestedModel.startsWith('gpt') || requestedModel.startsWith('o')) {
        selectedProvider = 'openai';
      } else if (requestedModel.startsWith('claude')) {
        selectedProvider = 'anthropic';
      } else if (requestedModel.includes('gemini')) {
        selectedProvider = 'lovable'; // Use lovable for all Gemini
      } else {
        // Default to OpenRouter for unknown models
        selectedProvider = 'openrouter';
      }
    } else {
      // Default fallback
      selectedProvider = provider || 'openai';
      model = 'gpt-5-2025-08-07';
    }
    
    // Get API key based on provider
    let apiKey: string | undefined;
    let apiUrl = '';
    let headers: Record<string, string> = {};
    let body: any = {};
    
    // Build mode gets a code-generation system prompt
    const systemPrompt = mode === 'build' 
      ? 'You are an expert software engineer. Generate complete, production-ready code with clear explanations. Include all necessary imports, error handling, and best practices. Format code in markdown code blocks with proper language tags.'
      : 'You are a helpful AI assistant.';
    
    if (selectedProvider === 'openai') {
      apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];
      
      body = {
        model,
        messages,
        max_completion_tokens: mode === 'build' ? 8192 : 4096,
        stream
      };
    } else if (selectedProvider === 'anthropic') {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }
      
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      };
      
      const messages = [
        ...conversationHistory.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];
      
      body = {
        model,
        messages,
        max_tokens: mode === 'build' ? 8192 : 4096,
        system: systemPrompt
      };
    } else if (selectedProvider === 'lovable') {
      // Lovable AI Gateway for Gemini models
      apiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!apiKey) {
        throw new Error('LOVABLE_API_KEY not configured');
      }
      
      apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];
      
      body = {
        model,
        messages,
        stream
      };
    } else if (selectedProvider === 'google') {
      apiKey = Deno.env.get('GOOGLE_API_KEY');
      if (!apiKey) {
        throw new Error('GOOGLE_API_KEY not configured');
      }
      
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      headers = {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      };
      
      const contents = conversationHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
      
      body = { contents };
    } else if (selectedProvider === 'openrouter') {
      apiKey = Deno.env.get('OPENROUTER_API_KEY');
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }
      
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Lovable AI'
      };
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];
      
      // Use the mapped model directly instead of looking it up
      console.log(`Single model OpenRouter request: ${requestedModel} -> ${model}`);
      
      body = {
        model,
        messages,
        stream,
        max_tokens: mode === 'build' ? 4096 : 2048
      };
    } else {
      throw new Error(`Unsupported provider: ${selectedProvider}`);
    }
    
    console.log('Calling AI provider:', selectedProvider, model, 'stream:', stream);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI provider error:', response.status, errorText);
      throw new Error(`AI provider error: ${response.status}`);
    }
    
    // Handle streaming response
    if (stream && (selectedProvider === 'openai' || selectedProvider === 'openrouter' || selectedProvider === 'lovable')) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }
          
          const decoder = new TextDecoder();
          let buffer = '';
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      const sseData = `data: ${JSON.stringify({ content, model, provider: selectedProvider })}\n\n`;
                      controller.enqueue(encoder.encode(sseData));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });
      
      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }
    
    // Handle non-streaming response
    const data = await response.json();
    console.log('AI response received:', JSON.stringify(data).substring(0, 200));
    
    let content: string;
    if (selectedProvider === 'openai') {
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid API response:', data);
        throw new Error(`Invalid response from ${selectedProvider}`);
      }
      content = data.choices[0].message.content;
    } else if (selectedProvider === 'openrouter' || selectedProvider === 'lovable') {
      const choice = data.choices?.[0];
      content =
        choice?.message?.content ??
        data.output_text ??
        choice?.text ??
        '';
      if (!content) {
        console.error('Invalid response:', data);
        content = 'The model could not generate a response at the moment. Please try again.';
      }
    } else if (selectedProvider === 'anthropic') {
      if (!data.content || !data.content[0]) {
        console.error('Invalid Anthropic response:', data);
        throw new Error('Invalid response from Anthropic');
      }
      content = data.content[0].text;
    } else if (selectedProvider === 'google') {
      if (!data.candidates || !data.candidates[0]) {
        console.error('Invalid Google response:', data);
        throw new Error('Invalid response from Google');
      }
      content = data.candidates[0].content.parts[0].text;
    } else {
      content = 'Response not supported for this provider';
    }
    
    return new Response(
      JSON.stringify({
        content,
        model,
        provider: selectedProvider,
        usage: data.usage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Chat error:', error);
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
