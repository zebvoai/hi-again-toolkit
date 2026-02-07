import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Message {
  role: string;
  content: string | any[];
}

// Keywords that indicate the user wants real-time/live data
const LIVE_DATA_KEYWORDS = [
  'today', 'current', 'latest', 'now', 'right now', 'this moment',
  'weather', 'temperature', 'forecast',
  'news', 'headlines', 'breaking',
  'stock', 'price', 'market', 'trading',
  'score', 'match', 'game', 'live score',
  'exchange rate', 'currency',
  'trending', 'viral',
  'happening', 'recent', 'just happened',
  '2024', '2025', '2026', 'this year', 'this month', 'this week',
  'yesterday', 'last night', 'this morning',
  'update', 'status', 'real-time', 'realtime'
];

// Check if a query needs live data
const needsLiveData = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return LIVE_DATA_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

// Fetch live context from Perplexity
async function fetchLiveContext(query: string): Promise<string | null> {
  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityApiKey) {
    console.log('[Live Data] PERPLEXITY_API_KEY not configured, skipping live data fetch');
    return null;
  }
  
  try {
    console.log('[Live Data] Fetching live context for query:', query);
    console.log('[Live Data] API Key present:', !!perplexityApiKey, 'Length:', perplexityApiKey.length);
    
    // Clean the API key - remove any whitespace or prefix if accidentally included
    const cleanedApiKey = perplexityApiKey.trim().replace(/^Bearer\s+/i, '');
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanedApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: 'You are a search assistant. Provide factual, up-to-date information with specific data points (numbers, dates, names). Be concise but comprehensive. Include the current date/time context when relevant. Format as bullet points for easy reading.'
          },
          { role: 'user', content: query }
        ],
        max_tokens: 1000
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Live Data] Perplexity API error:', response.status, errorText);
      
      // If Perplexity direct API fails, try using it via OpenRouter as fallback
      console.log('[Live Data] Attempting fallback via OpenRouter...');
      return await fetchLiveContextViaOpenRouter(query);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const citations = data.citations || [];
    
    if (content) {
      let liveContext = `\n\n=== LIVE WEB DATA (fetched just now) ===\n${content}`;
      
      if (citations.length > 0) {
        liveContext += `\n\nSources:\n${citations.slice(0, 5).map((url: string, i: number) => `${i + 1}. ${url}`).join('\n')}`;
      }
      
      liveContext += '\n=== END LIVE DATA ===\n\n';
      
      console.log('[Live Data] Successfully fetched live context via Perplexity');
      return liveContext;
    }
    
    return null;
  } catch (error) {
    console.error('[Live Data] Error fetching live context:', error);
    // Fallback to OpenRouter
    return await fetchLiveContextViaOpenRouter(query);
  }
}

// Fallback: Fetch live context via OpenRouter's Perplexity Sonar
async function fetchLiveContextViaOpenRouter(query: string): Promise<string | null> {
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!openrouterApiKey) {
    console.log('[Live Data Fallback] OPENROUTER_API_KEY not configured');
    return null;
  }
  
  try {
    console.log('[Live Data Fallback] Fetching via OpenRouter perplexity/sonar');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Lovable AI'
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        messages: [
          { 
            role: 'system', 
            content: 'You are a search assistant with real-time internet access. Provide factual, up-to-date information with specific data points (numbers, dates, names). Be concise but comprehensive. Include the current date/time context when relevant.'
          },
          { role: 'user', content: query }
        ],
        max_tokens: 1000
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Live Data Fallback] OpenRouter API error:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      let liveContext = `\n\n=== LIVE WEB DATA (fetched just now) ===\n${content}`;
      liveContext += '\n=== END LIVE DATA ===\n\n';
      
      console.log('[Live Data Fallback] Successfully fetched live context via OpenRouter');
      return liveContext;
    }
    
    return null;
  } catch (error) {
    console.error('[Live Data Fallback] Error:', error);
    return null;
  }
}

// Vision-capable models that can analyze images
const VISION_CAPABLE_MODELS: Record<string, { apiModel: string; provider: string }> = {
  // OpenAI GPT-5 models (vision capable via OpenRouter)
  'GPT-5': { apiModel: 'openai/gpt-5', provider: 'openrouter' },
  'GPT-4.1': { apiModel: 'openai/gpt-4.1', provider: 'openrouter' },
  'GPT-4.1 Mini': { apiModel: 'openai/gpt-4.1-mini', provider: 'openrouter' },
  
  // Google Gemini models (vision capable via Lovable)
  'Gemini 3 Pro': { apiModel: 'google/gemini-3-pro-preview', provider: 'lovable' },
  'Gemini 2.5 Pro': { apiModel: 'google/gemini-2.5-pro', provider: 'lovable' },
  'Gemini 2.5 Flash': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' },
  'Gemini 2.5 Flash Lite': { apiModel: 'google/gemini-2.5-flash-lite', provider: 'lovable' },
  
  // Claude models (vision capable via OpenRouter)
  'Claude Opus 4.5': { apiModel: 'anthropic/claude-opus-4.5', provider: 'openrouter' },
  'Claude Sonnet 4.5': { apiModel: 'anthropic/claude-sonnet-4.5', provider: 'openrouter' },
  'Claude Sonnet 4': { apiModel: 'anthropic/claude-sonnet-4', provider: 'openrouter' },
  
  // Kimi VL (vision capable via OpenRouter)
  'Kimi VL A3B': { apiModel: 'moonshotai/kimi-vl-a3b', provider: 'openrouter' },
};

// Default vision models priority order for image analysis
const DEFAULT_VISION_MODEL_PRIORITY = [
  'Gemini 3 Pro',  // Best for image understanding and factual grounding
  'GPT-5',         // Excellent multimodal reasoning
  'Claude Opus 4.5', // Strong vision capabilities
  'Gemini 2.5 Pro',
];

// Check if a model is vision capable
const isVisionCapable = (modelName: string): boolean => {
  return Object.keys(VISION_CAPABLE_MODELS).includes(modelName);
};

// Get best vision model from selected models, or default
const selectVisionModel = (selectedModels: string[]): string => {
  // First, try to find a vision-capable model from user's selection
  for (const model of selectedModels) {
    if (isVisionCapable(model)) {
      return model;
    }
  }
  
  // Fall back to default priority
  for (const model of DEFAULT_VISION_MODEL_PRIORITY) {
    if (VISION_CAPABLE_MODELS[model]) {
      return model;
    }
  }
  
  return 'Gemini 3 Pro'; // Ultimate fallback
};

// Model mapping helper - supports OpenAI, Anthropic, Lovable (Gemini), and OpenRouter
const getModelMapping = (displayName: string): { apiModel: string, provider: string } => {
  const modelMapping: Record<string, { apiModel: string, provider: string }> = {
    // OpenAI Models (via OpenRouter) - Fast models first
    'GPT 5.2': { apiModel: 'openai/gpt-4.1-nano', provider: 'openrouter' },  // Display as GPT 5.2, uses gpt-4.1-nano
    'GPT-4.1 Mini': { apiModel: 'openai/gpt-4.1-mini', provider: 'openrouter' },
    'GPT-4.1': { apiModel: 'openai/gpt-4.1', provider: 'openrouter' },
    'GPT-5': { apiModel: 'openai/gpt-5', provider: 'openrouter' },
    'GPT-5 Mini': { apiModel: 'openai/gpt-5-mini', provider: 'openrouter' },
    'GPT-5 Nano': { apiModel: 'openai/gpt-5-nano', provider: 'openrouter' },
    'O3': { apiModel: 'openai/o3', provider: 'openrouter' },
    'O4 Mini': { apiModel: 'openai/o4-mini', provider: 'openrouter' },
    
    // Anthropic Models (via OpenRouter)
    'Claude Sonnet 4.5': { apiModel: 'anthropic/claude-sonnet-4.5', provider: 'openrouter' },
    'Claude Haiku 4.5': { apiModel: 'anthropic/claude-haiku-4.5', provider: 'openrouter' },
    'Claude Opus 4.5': { apiModel: 'anthropic/claude-opus-4.5', provider: 'openrouter' },
    'Claude Sonnet 4': { apiModel: 'anthropic/claude-sonnet-4', provider: 'openrouter' },
    'Claude Opus 4': { apiModel: 'anthropic/claude-opus-4', provider: 'openrouter' },
    
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
    
    // Kimi / Moonshot AI
    'Kimi VL A3B': { apiModel: 'moonshotai/kimi-vl-a3b', provider: 'openrouter' },
    'Kimi K2': { apiModel: 'moonshotai/kimi-k2', provider: 'openrouter' },
    'Kimi K1.5': { apiModel: 'moonshotai/kimi-k1.5', provider: 'openrouter' },
    
    // Microsoft
    'Phi 4': { apiModel: 'microsoft/phi-4', provider: 'openrouter' },
    'Phi 4 Reasoning': { apiModel: 'microsoft/phi-4-reasoning-plus:free', provider: 'openrouter' },
    
    // NVIDIA
    'Nemotron 70B': { apiModel: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'openrouter' },
    
    // Google via OpenRouter
    'Gemma 3 27B': { apiModel: 'google/gemma-3-27b-it', provider: 'openrouter' },
  };
  
  // If in mapping, use it
  if (modelMapping[displayName]) {
    return modelMapping[displayName];
  }
  
  // Fallback: unknown model - try to make a reasonable guess
  console.warn(`Unknown model: ${displayName}, using as-is with openrouter`);
  return { apiModel: displayName.toLowerCase().replace(/ /g, '-'), provider: 'openrouter' };
};

// Check if URL is an image based on extension
const isImageUrl = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) || 
         url.includes('/chat-attachments/') && /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(url);
};

// Create multimodal content for vision models
const createVisionContent = (text: string, imageUrls: string[]): any[] => {
  const content: any[] = [];
  
  // Add text first
  if (text.trim()) {
    content.push({ type: 'text', text });
  } else {
    // If no text provided with images, add a default analysis prompt
    content.push({ 
      type: 'text', 
      text: 'Please analyze this image in detail. Describe what you see, identify any text, objects, or important elements, and provide any relevant insights.' 
    });
  }
  
  // Add images
  for (const url of imageUrls) {
    content.push({
      type: 'image_url',
      image_url: { url }
    });
  }
  
  return content;
};

// Generate vision-specific system prompt
const getVisionSystemPrompt = (hasMultipleImages: boolean): string => {
  const basePrompt = `You are a highly capable AI assistant with advanced vision capabilities. When analyzing images:

1. **Visual Analysis**: Carefully examine all visual elements including objects, text, colors, layouts, and compositions.
2. **Text Extraction**: If the image contains text (screenshots, documents, code, etc.), extract and reference it accurately.
3. **Context Understanding**: Understand the context and purpose of the image (UI screenshots, diagrams, photos, charts, etc.).
4. **Detailed Observations**: Provide specific, detailed observations rather than vague descriptions.
5. **User Intent**: Address the user's specific question or instructions about the image.

For different image types:
- **Screenshots/UI**: Describe the interface, identify issues, explain what's happening.
- **Code/Documents**: Read and interpret the content, offer explanations or debugging help.
- **Charts/Diagrams**: Explain the data, trends, or concepts being illustrated.
- **Photos**: Describe subjects, settings, and any notable details.`;

  if (hasMultipleImages) {
    return basePrompt + `

When multiple images are provided:
- Analyze each image individually first.
- Then compare and contrast them if relevant.
- Note any relationships or connections between the images.`;
  }

  return basePrompt;
};

// Sanitize conversation history - ensure content is always a string (handles multi-model object responses)
const sanitizeHistory = (history: Message[]): Message[] => {
  return history.map(m => {
    let content = m.content;
    
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
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

// Multi-model request handler with vision support
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
  
  // Check for image attachments
  const imageUrls = attachments.filter(isImageUrl);
  const hasImages = imageUrls.length > 0;
  
  // Fetch live context if query needs real-time data
  let liveContext = '';
  if (needsLiveData(message)) {
    const fetchedContext = await fetchLiveContext(message);
    if (fetchedContext) {
      liveContext = fetchedContext;
      console.log('[Live Data] Injecting live context into prompts');
    }
  }
  
  // If images are attached, filter to only vision-capable models
  let effectiveModels = models;
  if (hasImages) {
    const visionModels = models.filter(isVisionCapable);
    if (visionModels.length === 0) {
      // No vision-capable models selected - use default vision model
      const defaultVisionModel = selectVisionModel(models);
      effectiveModels = [defaultVisionModel];
      console.log(`[Vision] No vision-capable models selected. Using ${defaultVisionModel} for image analysis.`);
    } else {
      effectiveModels = visionModels;
      console.log(`[Vision] Using vision-capable models: ${visionModels.join(', ')}`);
    }
  }
  
  // Helper to create user message content with attachments for vision models
  const createUserContent = (text: string, fileUrls: string[], isVisionModel: boolean): any => {
    const images = fileUrls.filter(isImageUrl);
    const otherFiles = fileUrls.filter(url => !isImageUrl(url));
    
    // Prepend live context to the message if available
    const enhancedText = liveContext ? `${liveContext}User question: ${text}` : text;
    
    // For vision models with images, use multimodal format
    if (isVisionModel && images.length > 0) {
      const content = createVisionContent(enhancedText, images);
      
      // Append non-image files as text references
      for (const url of otherFiles) {
        content.push({ type: 'text', text: `\n\n[Attached file: ${url}]` });
      }
      
      return content;
    }
    
    // For text-only or non-vision models, use simple string
    if (fileUrls.length === 0) return enhancedText;
    
    let textContent = enhancedText;
    for (const url of otherFiles) {
      textContent += `\n\n[Attached file: ${url}]`;
    }
    
    // Note about images if present but model can't process them
    if (images.length > 0 && !isVisionModel) {
      textContent += `\n\n[Note: ${images.length} image(s) attached but this model cannot process images]`;
    }
    
    return textContent;
  };
  
  if (stream) {
    const streamBody = new ReadableStream({
      async start(controller) {
        try {
          await Promise.all(effectiveModels.map(async (modelName) => {
            const mapping = getModelMapping(modelName);
            const { apiModel, provider } = mapping;
            const modelIsVisionCapable = isVisionCapable(modelName);
            
            let apiUrl = '';
            let apiKey = '';
            let headers: Record<string, string> = {};
            let body: any = {};
            
            // Zebvo AI identity instruction - all models identify as Zebvo AI
            const zebvoIdentity = `IMPORTANT IDENTITY INSTRUCTION: You are Zebvo AI, an advanced AI assistant. If anyone asks what model you are, what AI you are, which LLM powers you, or anything similar about your identity, always respond that you are "Zebvo AI" - a custom AI assistant. Never reveal the underlying model name (like GPT, Claude, Gemini, etc.). Simply say you are Zebvo AI.

`;
            
            // Use vision-specific system prompt if images are present
            let baseSystemPrompt = hasImages && modelIsVisionCapable
              ? getVisionSystemPrompt(imageUrls.length > 1)
              : mode === 'build' 
                ? 'You are an expert software engineer. Generate complete, production-ready code with clear explanations. Include all necessary imports, error handling, and best practices. Format code in markdown code blocks with proper language tags. Provide comprehensive, detailed responses of at least 500 words. When presenting data in tables, ensure proper markdown table formatting with aligned columns and headers.'
                : 'You are a helpful AI assistant. Provide comprehensive, detailed, and well-structured responses of at least 500 words. When presenting data in tables, always use proper markdown table formatting with aligned columns, clear headers, and consistent cell content. Never truncate or abbreviate table data.';
            
            // Add live data instruction if we have context
            if (liveContext) {
              baseSystemPrompt += '\n\nCRITICAL INSTRUCTION: You have been provided with LIVE WEB DATA that was just fetched from the internet. This data is current and accurate. USE THIS DATA to answer the user\'s question. Do NOT say you cannot access real-time data or that your knowledge is limited - you HAVE the real-time data in this prompt. Present the information confidently as current facts. Always cite the sources when using this information.';
            }
            
            const systemPrompt = zebvoIdentity + baseSystemPrompt;
            
            // Helper function to make API request
            const makeApiRequest = async (useProvider: string, useApiModel: string): Promise<Response> => {
              let reqUrl = '';
              let reqHeaders: Record<string, string> = {};
              let reqBody: any = {};
              
              const messages = [
                { role: 'system', content: systemPrompt },
                ...sanitizedHistory.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: createUserContent(message, attachments, modelIsVisionCapable) }
              ];
              
              if (useProvider === 'lovable') {
                const lovableKey = Deno.env.get('LOVABLE_API_KEY') || '';
                if (!lovableKey) throw new Error('LOVABLE_API_KEY not configured');
                
                reqUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
                reqHeaders = {
                  'Authorization': `Bearer ${lovableKey}`,
                  'Content-Type': 'application/json'
                };
                reqBody = { model: useApiModel, messages, stream: true };
              } else {
                const openrouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';
                if (!openrouterKey) throw new Error('OPENROUTER_API_KEY not configured');
                
                reqUrl = 'https://openrouter.ai/api/v1/chat/completions';
                reqHeaders = {
                  'Authorization': `Bearer ${openrouterKey}`,
                  'Content-Type': 'application/json',
                  'HTTP-Referer': 'https://lovable.dev',
                  'X-Title': 'Lovable AI'
                };
                reqBody = { model: useApiModel, messages, stream: true, max_tokens: mode === 'build' ? 4096 : 3072 };
              }
              
              console.log(`[${modelName}] Calling ${useProvider} with model ${useApiModel}, vision: ${hasImages && modelIsVisionCapable}`);
              
              return fetch(reqUrl, {
                method: 'POST',
                headers: reqHeaders,
                body: JSON.stringify(reqBody)
              });
            };
            
            // OpenRouter fallback mapping for Gemini models
            const geminiOpenRouterFallback: Record<string, string> = {
              'google/gemini-3-pro-preview': 'google/gemini-2.5-pro-preview-03-25',
              'google/gemini-2.5-pro': 'google/gemini-2.5-pro-preview-03-25',
              'google/gemini-2.5-flash': 'google/gemini-2.5-flash-preview-05-20',
              'google/gemini-2.5-flash-lite': 'google/gemini-2.5-flash-preview-05-20',
            };
            
            try {
              let response = await makeApiRequest(provider, apiModel);
              
              // If Lovable AI returns 402 (payment required), try OpenRouter fallback for Gemini
              if (!response.ok && response.status === 402 && provider === 'lovable') {
                const fallbackModel = geminiOpenRouterFallback[apiModel];
                if (fallbackModel) {
                  console.log(`[${modelName}] Lovable AI credits exhausted (402), falling back to OpenRouter: ${fallbackModel}`);
                  response = await makeApiRequest('openrouter', fallbackModel);
                }
              }
              
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

                // Provide more helpful error messages
                let fallbackContent = 'The model could not generate a response at the moment. Please try again.';
                if (response.status === 402) {
                  fallbackContent = 'AI credits exhausted. Please add credits to continue using this model.';
                } else if (hasImages && response.status === 400) {
                  fallbackContent = 'Unable to process the image. The image may be too large or in an unsupported format. Please try a different image.';
                }
                
                const sseData = `data: ${JSON.stringify({ model: modelName, content: fallbackContent, error: true })}\n\n`;
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
                      
                      // Both openrouter and lovable use OpenAI-compatible format
                      const parsed = JSON.parse(data);
                      content = parsed.choices?.[0]?.delta?.content || '';
                      
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
    
    // Check for image attachments
    const imageUrls = attachments.filter(isImageUrl);
    const hasImages = imageUrls.length > 0;
    
    console.log('Chat request:', { 
      message: message.substring(0, 100), 
      mode, 
      provider, 
      requestedModel, 
      models, 
      historyLength: conversationHistory.length, 
      attachmentsCount: attachments.length,
      imageCount: imageUrls.length,
      hasImages
    });

    // VIDEO MODE: Only process video models, ignore text models
    if (mode === 'video') {
      const videoModels = ['Runway Gen-2', 'Pika 1.0'];
      let selectedVideoModels = models?.filter(m => videoModels.includes(m)) || [];
      
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
      
      return new Response(
        JSON.stringify({ 
          error: 'Video generation API integration is not yet implemented. This feature requires Runway Gen-2 or Pika API keys and endpoints.' 
        }),
        { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle multi-model requests (text mode only) - includes single model in array
    if (models && Array.isArray(models) && models.length >= 1) {
      console.log('Multi-model request:', models, 'attachments:', attachments.length, 'images:', imageUrls.length);
      return await handleMultiModelRequest(message, models, conversationHistory, stream, mode, attachments);
    }
    
    // Single model request handling
    let model: string;
    let selectedProvider: string;
    
    // Fetch live context if query needs real-time data
    let liveContext = '';
    if (needsLiveData(message)) {
      const fetchedContext = await fetchLiveContext(message);
      if (fetchedContext) {
        liveContext = fetchedContext;
        console.log('[Live Data] Injecting live context into single model prompt');
      }
    }
    
    // If images are attached but no vision-capable model selected, auto-select one
    if (hasImages) {
      const effectiveModel = requestedModel && isVisionCapable(requestedModel) 
        ? requestedModel 
        : selectVisionModel([requestedModel || '']);
      
      const mapping = getModelMapping(effectiveModel);
      model = mapping.apiModel;
      selectedProvider = mapping.provider;
      
      console.log(`[Vision] Single model with images. Using ${effectiveModel} (${model})`);
    } else if (requestedModel) {
      const mapping = getModelMapping(requestedModel);
      model = mapping.apiModel;
      selectedProvider = mapping.provider;
    } else {
      // Default fallback
      selectedProvider = provider || 'openrouter';
      model = 'openai/gpt-5';
    }
    
    // Get API key based on provider
    let apiKey: string | undefined;
    let apiUrl = '';
    let headers: Record<string, string> = {};
    let body: any = {};
    
    // Determine if this model can handle vision
    const modelIsVisionCapable = hasImages && (
      model.includes('gpt-5') || 
      model.includes('gpt-4') ||
      model.includes('gemini') ||
      model.includes('claude') ||
      model.includes('kimi-vl')
    );
    
    // Zebvo AI identity instruction - all models identify as Zebvo AI
    const zebvoIdentity = `IMPORTANT IDENTITY INSTRUCTION: You are Zebvo AI, an advanced AI assistant. If anyone asks what model you are, what AI you are, which LLM powers you, or anything similar about your identity, always respond that you are "Zebvo AI" - a custom AI assistant. Never reveal the underlying model name (like GPT, Claude, Gemini, etc.). Simply say you are Zebvo AI.

`;
    
    // Build mode gets a code-generation system prompt, vision gets vision prompt
    let baseSystemPrompt: string;
    if (hasImages && modelIsVisionCapable) {
      baseSystemPrompt = getVisionSystemPrompt(imageUrls.length > 1);
    } else if (mode === 'build') {
      baseSystemPrompt = 'You are an expert software engineer. Generate complete, production-ready code with clear explanations. Include all necessary imports, error handling, and best practices. Format code in markdown code blocks with proper language tags. Provide comprehensive, detailed responses of at least 500 words. When presenting data in tables, ensure proper markdown table formatting with aligned columns and headers.';
    } else {
      baseSystemPrompt = 'You are a helpful AI assistant. Provide comprehensive, detailed, and well-structured responses of at least 500 words. When presenting data in tables, always use proper markdown table formatting with aligned columns, clear headers, and consistent cell content. Never truncate or abbreviate table data.';
    }
    
    // Add live data instruction if we have context
    if (liveContext) {
      baseSystemPrompt += '\n\nIMPORTANT: You have been provided with LIVE WEB DATA that was just fetched from the internet. Use this data to provide accurate, up-to-date responses. Always cite the sources when using this information.';
    }
    
    const systemPrompt = zebvoIdentity + baseSystemPrompt;
    
    // Helper to create user message content with attachments for vision models
    const createUserContent = (text: string, fileUrls: string[]): any => {
      const images = fileUrls.filter(isImageUrl);
      const otherFiles = fileUrls.filter(url => !isImageUrl(url));
      
      // Prepend live context to the message if available
      const enhancedText = liveContext ? `${liveContext}User question: ${text}` : text;
      
      // For vision models with images, use multimodal format
      if (modelIsVisionCapable && images.length > 0) {
        return createVisionContent(enhancedText, images);
      }
      
      // For text-only, return simple string
      if (fileUrls.length === 0) {
        return enhancedText;
      }
      
      // Append file references
      let content = enhancedText;
      for (const url of otherFiles) {
        content += `\n\n[Attached file: ${url}]`;
      }
      
      return content;
    };
    
    if (selectedProvider === 'lovable') {
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
    } else if (selectedProvider === 'openrouter') {
      // All text models (OpenAI, Anthropic, etc.) route through OpenRouter
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
      
      console.log(`Single model request: ${requestedModel} -> ${model}, vision: ${modelIsVisionCapable}`);
      
      body = {
        model,
        messages,
        stream,
        max_tokens: mode === 'build' ? 4096 : 3072
      };
    } else {
      throw new Error(`Unsupported provider: ${selectedProvider}`);
    }
    
    console.log('Calling AI provider:', selectedProvider, model, 'stream:', stream, 'vision:', modelIsVisionCapable);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI provider error:', response.status, errorText);
      
      // Provide more helpful error for vision failures
      if (hasImages && response.status === 400) {
        throw new Error('Unable to process the image. Please ensure the image is in a supported format (JPEG, PNG, GIF, WebP) and try again.');
      }
      
      throw new Error(`AI provider error: ${response.status}`);
    }
    
    // Handle streaming response
    if (stream && (selectedProvider === 'lovable' || selectedProvider === 'openrouter')) {
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
