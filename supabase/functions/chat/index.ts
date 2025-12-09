import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

// Model mapping helper - supports OpenAI, Anthropic, Lovable (Gemini), and OpenRouter
const getModelMapping = (displayName: string): { apiModel: string, provider: string } => {
  const modelMapping: Record<string, { apiModel: string, provider: string }> = {
    // OpenAI Models (direct API)
    'GPT-5': { apiModel: 'gpt-5-2025-08-07', provider: 'openai' },
    'GPT-5 Mini': { apiModel: 'gpt-5-mini-2025-08-07', provider: 'openai' },
    'GPT-5 Nano': { apiModel: 'gpt-5-nano-2025-08-07', provider: 'openai' },
    'GPT-4.1': { apiModel: 'gpt-4.1-2025-04-14', provider: 'openai' },
    'GPT-4.1 Mini': { apiModel: 'gpt-4.1-mini-2025-04-14', provider: 'openai' },
    'O3': { apiModel: 'o3-2025-04-16', provider: 'openai' },
    'O4 Mini': { apiModel: 'o4-mini-2025-04-16', provider: 'openai' },
    
    // Anthropic Models (direct API) - Current Claude 4.x models per Anthropic docs
    'Claude Sonnet 4.5': { apiModel: 'claude-sonnet-4-5', provider: 'anthropic' },
    'Claude Haiku 4.5': { apiModel: 'claude-haiku-4-5', provider: 'anthropic' },
    'Claude Opus 4.5': { apiModel: 'claude-opus-4-5', provider: 'anthropic' },
    'Claude Sonnet 4': { apiModel: 'claude-sonnet-4-20250514', provider: 'anthropic' },
    'Claude Opus 4': { apiModel: 'claude-opus-4-20250514', provider: 'anthropic' },
    
    // Google Models (via Lovable AI Gateway)
    'Gemini 2.5 Pro': { apiModel: 'google/gemini-2.5-pro', provider: 'lovable' },
    'Gemini 3 Pro': { apiModel: 'google/gemini-3-pro-preview', provider: 'lovable' },
    'Gemini 2.5 Flash': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' },
    'Gemini 2.5 Flash Lite': { apiModel: 'google/gemini-2.5-flash-lite', provider: 'lovable' },
    'Gemini 2.0 Flash': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' },
    
    // OpenRouter Models - Curated top-quality models with correct API IDs
    // X.AI / Grok
    'Grok 4.1 Fast': { apiModel: 'x-ai/grok-4.1-fast', provider: 'openrouter' },
    'Grok 4 Fast': { apiModel: 'x-ai/grok-4-fast', provider: 'openrouter' },
    'Grok Code Fast': { apiModel: 'x-ai/grok-code-fast-1', provider: 'openrouter' },
    'Grok 3 Beta': { apiModel: 'x-ai/grok-3-beta', provider: 'openrouter' },
    
    // DeepSeek
    'DeepSeek R1': { apiModel: 'deepseek/deepseek-r1', provider: 'openrouter' },
    'DeepSeek V3': { apiModel: 'deepseek/deepseek-chat', provider: 'openrouter' },
    'DeepSeek R1 Distill Qwen 32B': { apiModel: 'deepseek/deepseek-r1-distill-qwen-32b', provider: 'openrouter' },
    
    // Qwen
    'Qwen 3 32B': { apiModel: 'qwen/qwen3-32b', provider: 'openrouter' },
    'Qwen 2.5 72B': { apiModel: 'qwen/qwen-2.5-72b-instruct', provider: 'openrouter' },
    
    // Mistral
    'Mistral Large': { apiModel: 'mistralai/mistral-large-2411', provider: 'openrouter' },
    'Mistral Medium': { apiModel: 'mistralai/mistral-medium-3', provider: 'openrouter' },
    'Mistral Nemo': { apiModel: 'mistralai/mistral-nemo', provider: 'openrouter' },
    
    // Meta Llama
    'Llama 4 Maverick': { apiModel: 'meta-llama/llama-4-maverick', provider: 'openrouter' },
    'Llama 4 Scout': { apiModel: 'meta-llama/llama-4-scout', provider: 'openrouter' },
    'Llama 3.3 70B': { apiModel: 'meta-llama/llama-3.3-70b-instruct', provider: 'openrouter' },
    'Llama 3.1 405B': { apiModel: 'meta-llama/llama-3.1-405b-instruct', provider: 'openrouter' },
    
    // MiniMax
    'MiniMax M2': { apiModel: 'minimax/minimax-m2', provider: 'openrouter' },
    
    // Cohere
    'Command R+': { apiModel: 'cohere/command-r-plus-08-2024', provider: 'openrouter' },
    'Command R': { apiModel: 'cohere/command-r-08-2024', provider: 'openrouter' },
    'Command A': { apiModel: 'cohere/command-a-03-2025', provider: 'openrouter' },
    
    // Perplexity
    'Perplexity Sonar Pro': { apiModel: 'perplexity/sonar-pro', provider: 'openrouter' },
    'Perplexity Sonar': { apiModel: 'perplexity/sonar', provider: 'openrouter' },
    
    // Microsoft
    'Phi 4': { apiModel: 'microsoft/phi-4', provider: 'openrouter' },
    'Phi 4 Reasoning': { apiModel: 'microsoft/phi-4-reasoning-plus', provider: 'openrouter' },
    
    // NVIDIA
    'Nemotron 70B': { apiModel: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'openrouter' },
    
    // Google via OpenRouter
    'Gemma 3 27B': { apiModel: 'google/gemma-3-27b-it', provider: 'openrouter' },
    
    // Moonshot AI - Kimi models
    'Kimi K2': { apiModel: 'moonshotai/kimi-k2', provider: 'openrouter' },
    'Kimi VL': { apiModel: 'moonshotai/kimi-vl-a3b-thinking', provider: 'openrouter' },
  };
  
  // If in mapping, use it
  if (modelMapping[displayName]) {
    return modelMapping[displayName];
  }
  
  // Fallback: unknown model - try to make a reasonable guess
  console.warn(`Unknown model: ${displayName}, using as-is with openrouter`);
  return { apiModel: displayName.toLowerCase().replace(/ /g, '-'), provider: 'openrouter' };
};

// Multi-model request handler
// Sanitize conversation history - ensure content is always a string (handles multi-model object responses)
const sanitizeHistory = (history: Message[]): Message[] => {
  return history.map(m => {
    let content = m.content;
    
    if (typeof content === 'object' && content !== null) {
      // Multi-model object - pick first model's response
      const values = Object.values(content);
      content = typeof values[0] === 'string' ? values[0] : '';
    }
    
    return {
      role: m.role,
      content: typeof content === 'string' ? content : ''
    };
  });
};

async function handleMultiModelRequest(
  message: string,
  models: string[],
  conversationHistory: Message[],
  stream: boolean,
  mode: string = 'text',
  attachments: string[] = []
): Promise<Response> {
  const encoder = new TextEncoder();
  
  // Sanitize history before processing
  const sanitizedHistory = sanitizeHistory(conversationHistory);
  
  // Helper to create user message content with attachments for vision models
  const createUserContent = (text: string, fileUrls: string[]): any => {
    if (fileUrls.length === 0) return text;
    
    const content: any[] = [{ type: 'text', text }];
    for (const url of fileUrls) {
      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
      if (isImage) {
        content.push({ type: 'image_url', image_url: { url } });
      } else {
        content.push({ type: 'text', text: `\n\n[Attached file: ${url}]` });
      }
    }
    return content;
  };
  
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
            // Perplexity models have internet access and can search the web
            const isPerplexityModel = modelName.toLowerCase().includes('perplexity') || modelName.toLowerCase().includes('sonar');
            
            let systemPrompt = '';
            if (mode === 'build') {
              systemPrompt = 'You are an expert software engineer. Generate complete, production-ready code with clear explanations. Include all necessary imports, error handling, and best practices. Format code in markdown code blocks with proper language tags.';
            } else if (isPerplexityModel) {
              systemPrompt = 'You are Perplexity, an advanced AI research assistant with real-time web search capabilities. When answering questions:\n1. Search the web thoroughly for the most current and accurate information\n2. Provide comprehensive, detailed, and well-structured responses\n3. Include specific facts, statistics, dates, and sources when available\n4. Cite your sources with URLs when possible\n5. For news and current events, always include the latest updates\n6. Give thorough explanations with multiple perspectives when relevant\n7. Use markdown formatting for better readability (headers, lists, bold text)\n8. Never give brief or superficial answers - always aim for depth and completeness';
            } else {
              systemPrompt = 'You are a helpful AI assistant. Note: You do not have real-time internet access. For current weather, news, or live data, users should use Perplexity Sonar or Perplexity Sonar Pro models which have web search capabilities.';
            }
            
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
                  ...sanitizedHistory.map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content: createUserContent(message, attachments) }
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
                
                // Anthropic uses different format for images
                const createAnthropicContent = (text: string, fileUrls: string[]): any => {
                  if (fileUrls.length === 0) return text;
                  const content: any[] = [{ type: 'text', text }];
                  for (const url of fileUrls) {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
                    if (isImage) {
                      content.push({ type: 'image', source: { type: 'url', url } });
                    } else {
                      content.push({ type: 'text', text: `\n\n[Attached file: ${url}]` });
                    }
                  }
                  return content;
                };
                
                const messages = [
                  ...sanitizedHistory.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content: createAnthropicContent(message, attachments) }
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
                  ...sanitizedHistory.map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content: createUserContent(message, attachments) }
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
                
                const contents = sanitizedHistory.map(m => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }]
                }));
                
                // Google uses parts array for multimodal content
                const createGoogleParts = (text: string, fileUrls: string[]): any[] => {
                  const parts: any[] = [{ text }];
                  for (const url of fileUrls) {
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
                    if (isImage) {
                      parts.push({ inlineData: { mimeType: 'image/jpeg', data: url } });
                    } else {
                      parts.push({ text: `\n\n[Attached file: ${url}]` });
                    }
                  }
                  return parts;
                };
                
                contents.push({ role: 'user', parts: createGoogleParts(message, attachments) });
                
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
                  ...sanitizedHistory.map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content: createUserContent(message, attachments) }
                ];
                
                // Perplexity models need higher token limits for comprehensive responses
                const maxTokens = isPerplexityModel ? 8192 : (mode === 'build' ? 4096 : 2048);
                body = { model: apiModel, messages, stream: true, max_tokens: maxTokens };
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
  attachments?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, mode, conversationHistory = [], provider, model: requestedModel, models, stream = false, attachments = [] }: ChatRequest = await req.json();
    
    console.log('Chat request:', { message, mode, provider, requestedModel, models, historyLength: conversationHistory.length, attachmentsCount: attachments.length });

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

    // Handle multi-model requests (text mode only) - includes single model in array
    if (models && Array.isArray(models) && models.length >= 1) {
      console.log('Multi-model request:', models, 'attachments:', attachments.length);
      return await handleMultiModelRequest(message, models, conversationHistory, stream, mode, attachments);
    }
    
    // Determine actual model and provider using the unified getModelMapping function
    let model: string;
    let selectedProvider: string;
    
    if (requestedModel) {
      const mapping = getModelMapping(requestedModel);
      model = mapping.apiModel;
      selectedProvider = mapping.provider;
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
    // Perplexity models have internet access and can search the web
    const isPerplexityModel = requestedModel?.toLowerCase().includes('perplexity') || requestedModel?.toLowerCase().includes('sonar');
    
    let systemPrompt = '';
    if (mode === 'build') {
      systemPrompt = 'You are an expert software engineer. Generate complete, production-ready code with clear explanations. Include all necessary imports, error handling, and best practices. Format code in markdown code blocks with proper language tags.';
    } else if (isPerplexityModel) {
      systemPrompt = 'You are Perplexity, an advanced AI research assistant with real-time web search capabilities. When answering questions:\n1. Search the web thoroughly for the most current and accurate information\n2. Provide comprehensive, detailed, and well-structured responses\n3. Include specific facts, statistics, dates, and sources when available\n4. Cite your sources with URLs when possible\n5. For news and current events, always include the latest updates\n6. Give thorough explanations with multiple perspectives when relevant\n7. Use markdown formatting for better readability (headers, lists, bold text)\n8. Never give brief or superficial answers - always aim for depth and completeness';
    } else {
      systemPrompt = 'You are a helpful AI assistant.';
    }
    
    // Helper to create user message content with attachments for vision models
    const createUserContent = (text: string, fileUrls: string[]): any => {
      if (fileUrls.length === 0) {
        return text;
      }
      
      // Vision models can process images - create multipart content
      const content: any[] = [{ type: 'text', text }];
      
      for (const url of fileUrls) {
        // Check if it's an image by extension
        const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
        if (isImage) {
          content.push({
            type: 'image_url',
            image_url: { url }
          });
        } else {
          // For non-image files, append URL as text context
          content.push({
            type: 'text',
            text: `\n\n[Attached file: ${url}]`
          });
        }
      }
      
      return content;
    };
    
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
        { role: 'user', content: createUserContent(message, attachments) }
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
      
      // Anthropic uses different format for images
      const createAnthropicContent = (text: string, fileUrls: string[]): any => {
        if (fileUrls.length === 0) return text;
        
        const content: any[] = [{ type: 'text', text }];
        for (const url of fileUrls) {
          const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
          if (isImage) {
            content.push({
              type: 'image',
              source: { type: 'url', url }
            });
          } else {
            content.push({ type: 'text', text: `\n\n[Attached file: ${url}]` });
          }
        }
        return content;
      };
      
      const messages = [
        ...conversationHistory.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: createAnthropicContent(message, attachments) }
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
        { role: 'user', content: createUserContent(message, attachments) }
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
      
      // Google uses parts array for multimodal content
      const createGoogleParts = (text: string, fileUrls: string[]): any[] => {
        const parts: any[] = [{ text }];
        for (const url of fileUrls) {
          const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
          if (isImage) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: url } });
          } else {
            parts.push({ text: `\n\n[Attached file: ${url}]` });
          }
        }
        return parts;
      };
      
      const contents = conversationHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      contents.push({
        role: 'user',
        parts: createGoogleParts(message, attachments)
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
        { role: 'user', content: createUserContent(message, attachments) }
      ];
      
      console.log(`Single model OpenRouter request: ${requestedModel} -> ${model}`);
      
      // Perplexity models need higher token limits for comprehensive responses
      const maxTokens = isPerplexityModel ? 8192 : (mode === 'build' ? 4096 : 2048);
      
      body = {
        model,
        messages,
        stream,
        max_tokens: maxTokens
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
    if (stream && (selectedProvider === 'openai' || selectedProvider === 'lovable' || selectedProvider === 'openrouter')) {
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
    } else if (selectedProvider === 'lovable' || selectedProvider === 'openrouter') {
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
