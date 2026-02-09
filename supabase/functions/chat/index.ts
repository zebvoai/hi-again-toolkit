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

// Extract URLs from a message
const extractUrls = (message: string): string[] => {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const matches = message.match(urlRegex) || [];
  // Clean up trailing punctuation
  return matches.map(url => url.replace(/[.,;:!?)]+$/, ''));
};

// Check if message contains URLs that need fetching
const containsUrls = (message: string): boolean => {
  return extractUrls(message).length > 0;
};

// Check if a query needs live data
const needsLiveData = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  // Also trigger for URLs since we need to fetch them
  if (containsUrls(message)) return true;
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
    // Check if query contains URLs - need to fetch URL content specifically
    const urls = extractUrls(query);
    const hasUrls = urls.length > 0;
    
    console.log('[Live Data] Fetching live context for query:', query);
    console.log('[Live Data] URLs detected:', urls.length, hasUrls ? urls : '');
    console.log('[Live Data] API Key present:', !!perplexityApiKey, 'Length:', perplexityApiKey.length);
    
    // Clean the API key - remove any whitespace or prefix if accidentally included
    const cleanedApiKey = perplexityApiKey.trim().replace(/^Bearer\s+/i, '');
    
    // Build the appropriate system prompt based on whether URLs are present
    const systemPrompt = hasUrls 
      ? `You are a web content analyzer with real-time internet access. When given URLs, you MUST:
1. Actually visit and read the content from those URLs
2. Provide a comprehensive summary of what is on each page
3. Extract key information, main topics, and important details
4. If the URL is a company/product page, describe what they offer
5. If the URL is an article, summarize the main points
6. Always confirm you accessed the URL and describe its actual content
DO NOT say you cannot access URLs - you CAN and MUST fetch and summarize them.`
      : 'You are a search assistant. Provide factual, up-to-date information with specific data points (numbers, dates, names). Be concise but comprehensive. Include the current date/time context when relevant. Format as bullet points for easy reading.';
    
    // Build the user message - emphasize URL fetching if URLs present
    const userMessage = hasUrls 
      ? `Please visit and summarize the content from the following URL(s): ${urls.join(', ')}\n\nUser's question: ${query}`
      : query;
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanedApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro', // Use sonar-pro for better URL fetching
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 2000, // More tokens for URL content
        search_domain_filter: hasUrls ? urls.map(u => new URL(u).hostname) : undefined
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
    // Check for URLs in query
    const urls = extractUrls(query);
    const hasUrls = urls.length > 0;
    
    console.log('[Live Data Fallback] Fetching via OpenRouter perplexity/sonar-pro');
    
    const systemPrompt = hasUrls 
      ? `You are a web content analyzer with real-time internet access. When given URLs, you MUST:
1. Actually visit and read the content from those URLs
2. Provide a comprehensive summary of what is on each page
3. Extract key information, main topics, and important details
4. If the URL is a company/product page, describe what they offer
5. If the URL is an article, summarize the main points
6. Always confirm you accessed the URL and describe its actual content
DO NOT say you cannot access URLs - you CAN and MUST fetch and summarize them.`
      : 'You are a search assistant with real-time internet access. Provide factual, up-to-date information with specific data points (numbers, dates, names). Be concise but comprehensive. Include the current date/time context when relevant.';
    
    const userMessage = hasUrls 
      ? `Please visit and summarize the content from the following URL(s): ${urls.join(', ')}\n\nUser's question: ${query}`
      : query;
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Lovable AI'
      },
      body: JSON.stringify({
        model: 'perplexity/sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 2000
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
  'GPT 5.2': { apiModel: 'openai/gpt-5', provider: 'openrouter' },
  'GPT-4.1': { apiModel: 'openai/gpt-4.1', provider: 'openrouter' },
  'GPT-4.1 Mini': { apiModel: 'openai/gpt-4.1-mini', provider: 'openrouter' },
  
  // Google Gemini models (vision capable via Lovable)
  'Gemini 3 Pro': { apiModel: 'google/gemini-3-pro-preview', provider: 'lovable' },
  'Gemini 2.5 Pro': { apiModel: 'google/gemini-2.5-pro', provider: 'lovable' },
  'Gemini 2.5 Flash': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' },
  'Gemini 2.5 Flash Lite': { apiModel: 'google/gemini-2.5-flash-lite', provider: 'lovable' },
  
  // Claude models (vision capable via OpenRouter)
  'Claude Opus 4.6': { apiModel: 'anthropic/claude-opus-4.5', provider: 'openrouter' },
  'Claude Sonnet 4.5': { apiModel: 'anthropic/claude-sonnet-4.5', provider: 'openrouter' },
  'Claude Sonnet 4': { apiModel: 'anthropic/claude-sonnet-4', provider: 'openrouter' },
  
  // Kimi VL (vision capable via OpenRouter)
  'Kimi VL A3B': { apiModel: 'moonshotai/kimi-vl-a3b', provider: 'openrouter' },
};

// Default vision models for image analysis when no vision-capable models are selected
const DEFAULT_VISION_MODELS = [
  'GPT 5.2',           // Excellent multimodal reasoning
  'Claude Opus 4.6', // Strong vision capabilities
  'Gemini 3 Pro',    // Best for image understanding and factual grounding
];

// Check if a model is vision capable
const isVisionCapable = (modelName: string): boolean => {
  return Object.keys(VISION_CAPABLE_MODELS).includes(modelName);
};

// Get vision models from selected models, or defaults
const selectVisionModels = (selectedModels: string[]): string[] => {
  // First, filter user's selection to vision-capable models
  const userVisionModels = selectedModels.filter(isVisionCapable);
  
  if (userVisionModels.length > 0) {
    return userVisionModels;
  }
  
  // Fall back to default vision models (all of them, not just one)
  return DEFAULT_VISION_MODELS.filter(model => VISION_CAPABLE_MODELS[model]);
};

// Model mapping helper - maps flagship display names to fast internal APIs
// User sees flagship name, system uses fast variant
const getModelMapping = (displayName: string): { apiModel: string, provider: string } => {
  const modelMapping: Record<string, { apiModel: string, provider: string }> = {
    // OpenAI - Flagship "GPT 5.2" uses fast GPT-4.1 Nano internally
    'GPT 5.2': { apiModel: 'openai/gpt-4.1-nano', provider: 'openrouter' },
    'GPT-5': { apiModel: 'openai/gpt-4.1-nano', provider: 'openrouter' },  // Legacy
    'GPT 4.1 Nano': { apiModel: 'openai/gpt-4.1-nano', provider: 'openrouter' },  // Legacy
    'GPT-4.1 Mini': { apiModel: 'openai/gpt-4.1-mini', provider: 'openrouter' },
    'GPT-4.1': { apiModel: 'openai/gpt-4.1', provider: 'openrouter' },
    'GPT-5 Mini': { apiModel: 'openai/gpt-5-mini', provider: 'openrouter' },
    'GPT-5 Nano': { apiModel: 'openai/gpt-5-nano', provider: 'openrouter' },
    'O3': { apiModel: 'openai/o3', provider: 'openrouter' },
    'O4 Mini': { apiModel: 'openai/o4-mini', provider: 'openrouter' },
    
    // Anthropic - Flagship "Claude Opus 4.6" uses fast Haiku 3.5 internally
    'Claude Opus 4.6': { apiModel: 'anthropic/claude-3.5-haiku', provider: 'openrouter' },
    'Claude Sonnet 4': { apiModel: 'anthropic/claude-3.5-haiku', provider: 'openrouter' },  // Legacy
    'Claude Haiku 3.5': { apiModel: 'anthropic/claude-3.5-haiku', provider: 'openrouter' },  // Legacy
    'Claude Sonnet 4.5': { apiModel: 'anthropic/claude-sonnet-4.5', provider: 'openrouter' },
    'Claude Haiku 4.5': { apiModel: 'anthropic/claude-haiku-4.5', provider: 'openrouter' },
    'Claude Opus 4.5': { apiModel: 'anthropic/claude-opus-4.5', provider: 'openrouter' },
    'Claude Opus 4': { apiModel: 'anthropic/claude-opus-4', provider: 'openrouter' },
    
    // Google - Flagship "Gemini 3 Pro" uses fast Flash internally
    'Gemini 3 Pro': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' },
    'Gemini 2.5 Pro': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' },  // Legacy
    'Gemini 2.5 Flash': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' },  // Legacy
    'Gemini 2.5 Flash Lite': { apiModel: 'google/gemini-2.5-flash-lite', provider: 'lovable' },
    'Gemini 2.0 Flash': { apiModel: 'google/gemini-2.5-flash', provider: 'lovable' },
    
    // X.AI / Grok - Flagship "Grok 4" uses Mini internally
    'Grok 4': { apiModel: 'x-ai/grok-3-mini-beta', provider: 'openrouter' },
    'Grok 3': { apiModel: 'x-ai/grok-3-mini-beta', provider: 'openrouter' },  // Legacy
    'Grok 3 Mini': { apiModel: 'x-ai/grok-3-mini-beta', provider: 'openrouter' },  // Legacy
    'Grok 4.1 Fast': { apiModel: 'x-ai/grok-4.1-fast', provider: 'openrouter' },
    'Grok 4 Fast': { apiModel: 'x-ai/grok-4-fast', provider: 'openrouter' },
    'Grok Code Fast': { apiModel: 'x-ai/grok-code-fast-1', provider: 'openrouter' },
    'Grok 3 Beta': { apiModel: 'x-ai/grok-3-beta', provider: 'openrouter' },
    
    // DeepSeek - Flagship "DeepSeek-R1" uses chat internally
    'DeepSeek-R1': { apiModel: 'deepseek/deepseek-chat', provider: 'openrouter' },
    'DeepSeek R1': { apiModel: 'deepseek/deepseek-chat', provider: 'openrouter' },  // Legacy
    'DeepSeek V3': { apiModel: 'deepseek/deepseek-chat', provider: 'openrouter' },  // Legacy
    'DeepSeek R1 Distill Qwen 32B': { apiModel: 'deepseek/deepseek-r1-distill-qwen-32b', provider: 'openrouter' },
    
    // Qwen - Flagship "Qwen3-Max" uses 235B internally
    'Qwen3-Max': { apiModel: 'qwen/qwen3-235b-a22b', provider: 'openrouter' },
    'Qwen 3': { apiModel: 'qwen/qwen3-235b-a22b', provider: 'openrouter' },  // Legacy
    'Qwen 3 235B': { apiModel: 'qwen/qwen3-235b-a22b', provider: 'openrouter' },  // Legacy
    'Qwen 3 32B': { apiModel: 'qwen/qwen3-32b', provider: 'openrouter' },
    'Qwen 2.5 72B': { apiModel: 'qwen/qwen-2.5-72b-instruct', provider: 'openrouter' },
    
    // Mistral - Flagship "Mistral Large 3" uses Small internally
    'Mistral Large 3': { apiModel: 'mistralai/mistral-small-3.1-24b-instruct', provider: 'openrouter' },
    'Mistral Large': { apiModel: 'mistralai/mistral-small-3.1-24b-instruct', provider: 'openrouter' },  // Legacy
    'Mistral Small 3.1': { apiModel: 'mistralai/mistral-small-3.1-24b-instruct', provider: 'openrouter' },  // Legacy
    'Mistral Medium': { apiModel: 'mistralai/mistral-medium-3', provider: 'openrouter' },
    'Mistral Nemo': { apiModel: 'mistralai/mistral-nemo', provider: 'openrouter' },
    
    // MiniMax - Flagship "MiniMax M2.1" uses M1 internally
    'MiniMax M2.1': { apiModel: 'minimax/minimax-m1', provider: 'openrouter' },
    'MiniMax 01': { apiModel: 'minimax/minimax-m1', provider: 'openrouter' },  // Legacy
    'MiniMax M1': { apiModel: 'minimax/minimax-m1', provider: 'openrouter' },  // Legacy
    'MiniMax M2': { apiModel: 'minimax/minimax-m2', provider: 'openrouter' },
    
    // Cohere - Flagship "Command A" uses command-a internally
    'Command A': { apiModel: 'cohere/command-a-03-2025', provider: 'openrouter' },
    'Command R+': { apiModel: 'cohere/command-r-08-2024', provider: 'openrouter' },  // Legacy
    'Command R': { apiModel: 'cohere/command-r-08-2024', provider: 'openrouter' },  // Legacy
    
    // Perplexity - Flagship "Perplexity Sonar Pro" uses sonar-pro internally
    'Perplexity Sonar Pro': { apiModel: 'perplexity/sonar-pro', provider: 'openrouter' },
    'Perplexity Pro': { apiModel: 'perplexity/sonar', provider: 'openrouter' },  // Legacy
    'Perplexity Sonar': { apiModel: 'perplexity/sonar', provider: 'openrouter' },  // Legacy
    
    // Kimi / Moonshot AI - Flagship "Kimi K2.5" uses kimi-k2 internally
    'Kimi K2.5': { apiModel: 'moonshotai/kimi-k2', provider: 'openrouter' },
    'Kimi K2': { apiModel: 'moonshotai/kimi-k2', provider: 'openrouter' },  // Legacy
    'Kimi VL A3B': { apiModel: 'moonshotai/kimi-vl-a3b', provider: 'openrouter' },
    'Kimi K1.5': { apiModel: 'moonshotai/kimi-k1.5', provider: 'openrouter' },
    
    // Microsoft
    'Phi 4': { apiModel: 'microsoft/phi-4', provider: 'openrouter' },
    'Phi 4 Reasoning': { apiModel: 'microsoft/phi-4-reasoning-plus:free', provider: 'openrouter' },
    
    // NVIDIA - Flagship "Nemotron 3 Ultra" uses 70B internally
    'Nemotron 3 Ultra': { apiModel: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'openrouter' },
    'Nemotron Ultra': { apiModel: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'openrouter' },  // Legacy
    'Nemotron 70B': { apiModel: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'openrouter' },  // Legacy
    
    // Google via OpenRouter - Flagship "Gemma 3 27B"
    'Gemma 3 27B': { apiModel: 'google/gemma-3-27b-it', provider: 'openrouter' },
    'Gemma 3': { apiModel: 'google/gemma-3-27b-it', provider: 'openrouter' },  // Legacy
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

// Check if URL is a PDF
const isPdfUrl = (url: string): boolean => {
  return /\.pdf$/i.test(url) || 
         (url.includes('/chat-attachments/') && /\.pdf/i.test(url));
};

// Check if URL is a document (PDF, Word, etc.)
const isDocumentUrl = (url: string): boolean => {
  return /\.(pdf|docx?|xlsx?|pptx?|txt|csv|md|json)$/i.test(url) ||
         (url.includes('/chat-attachments/') && /\.(pdf|docx?|xlsx?|pptx?|txt|csv|md|json)/i.test(url));
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

// Pre-analyze images with a fast vision model so non-vision models can use the description
async function getVisionProxyDescription(imageUrls: string[], userMessage: string): Promise<string> {
  // Use Gemini 2.5 Flash (fast & cheap) as the proxy vision model
  const lovableKey = Deno.env.get('LOVABLE_API_KEY') || '';
  
  if (!lovableKey) {
    console.log('[Vision Proxy] No LOVABLE_API_KEY, trying OpenRouter Claude');
    // Fallback to Claude via OpenRouter
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';
    if (!openrouterKey) return '[Image attached but could not be analyzed]';
    
    try {
      const content = createVisionContent(
        'Describe this image in comprehensive detail. Include all visible text, objects, colors, layout, UI elements, diagrams, charts, or any other notable content. Be thorough and specific.',
        imageUrls
      );
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.dev',
          'X-Title': 'Lovable AI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4',
          messages: [
            { role: 'system', content: 'You are an image analysis assistant. Provide a detailed, factual description of the image(s).' },
            { role: 'user', content }
          ],
          max_tokens: 1500
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const desc = data.choices?.[0]?.message?.content || '';
        if (desc) {
          console.log('[Vision Proxy] Got description via Claude, length:', desc.length);
          return desc;
        }
      }
    } catch (e) {
      console.error('[Vision Proxy] Claude fallback failed:', e);
    }
    return '[Image attached but could not be analyzed]';
  }
  
  try {
    const content = createVisionContent(
      'Describe this image in comprehensive detail. Include all visible text, objects, colors, layout, UI elements, diagrams, charts, or any other notable content. Be thorough and specific.',
      imageUrls
    );
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an image analysis assistant. Provide a detailed, factual description of the image(s).' },
          { role: 'user', content }
        ],
        max_tokens: 1500
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const desc = data.choices?.[0]?.message?.content || '';
      if (desc) {
        console.log('[Vision Proxy] Got description via Gemini Flash, length:', desc.length);
        return desc;
      }
    } else {
      console.error('[Vision Proxy] Gemini Flash failed:', response.status);
      // Try Claude as fallback
      const openrouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';
      if (openrouterKey) {
        const content2 = createVisionContent(
          'Describe this image in comprehensive detail.',
          imageUrls
        );
        const resp2 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://lovable.dev',
            'X-Title': 'Lovable AI'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-sonnet-4',
            messages: [
              { role: 'system', content: 'You are an image analysis assistant. Provide a detailed, factual description of the image(s).' },
              { role: 'user', content: content2 }
            ],
            max_tokens: 1500
          })
        });
        if (resp2.ok) {
          const data2 = await resp2.json();
          const desc2 = data2.choices?.[0]?.message?.content || '';
          if (desc2) {
            console.log('[Vision Proxy] Got description via Claude fallback, length:', desc2.length);
            return desc2;
          }
        }
      }
    }
  } catch (e) {
    console.error('[Vision Proxy] Error:', e);
  }
  
  return '[Image attached but could not be analyzed]';
}

// Extract text content from PDF using vision model
async function extractPdfContent(pdfUrls: string[], userMessage: string): Promise<string> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY') || '';
  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';
  
  console.log(`[PDF Extraction] Processing ${pdfUrls.length} PDF(s)`);
  
  // For PDFs, we need to use a model that can handle document URLs
  // Gemini models can process PDFs directly via their file API workaround
  // We'll use Claude or GPT for PDF analysis as they handle document URLs better
  
  const extractionPrompt = `You are a document analysis assistant. Please analyze the following PDF document(s) thoroughly and provide:

1. **Complete text extraction**: Extract ALL text content from the document(s), preserving structure and formatting as much as possible.
2. **Summary**: Provide a brief summary of what the document is about.
3. **Key sections**: Identify and list major sections/headings.
4. **Important data**: Extract any tables, figures, or data points.

Be thorough and comprehensive. This extraction will be used to answer user questions about the document.

User's question about the document: ${userMessage}

Document URL(s): ${pdfUrls.join(', ')}`;

  // Try with Claude first (via OpenRouter) - Claude handles document analysis well
  if (openrouterKey) {
    try {
      console.log('[PDF Extraction] Attempting extraction via Claude...');
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.dev',
          'X-Title': 'Lovable AI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert document analysis assistant. Extract and summarize document content comprehensively. When given a PDF URL, analyze its contents thoroughly.' 
            },
            { role: 'user', content: extractionPrompt }
          ],
          max_tokens: 4000
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content && content.length > 100) {
          console.log('[PDF Extraction] Success via Claude, length:', content.length);
          return content;
        }
      } else {
        console.log('[PDF Extraction] Claude failed, status:', response.status);
      }
    } catch (e) {
      console.error('[PDF Extraction] Claude error:', e);
    }
  }
  
  // Fallback to Gemini via Lovable AI
  if (lovableKey) {
    try {
      console.log('[PDF Extraction] Attempting extraction via Gemini...');
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert document analysis assistant. Extract and summarize document content comprehensively.' 
            },
            { role: 'user', content: extractionPrompt }
          ],
          max_tokens: 4000
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content && content.length > 100) {
          console.log('[PDF Extraction] Success via Gemini, length:', content.length);
          return content;
        }
      } else {
        console.log('[PDF Extraction] Gemini failed, status:', response.status);
      }
    } catch (e) {
      console.error('[PDF Extraction] Gemini error:', e);
    }
  }
  
  // If all else fails, return a helpful message with the URL
  return `[PDF document attached: ${pdfUrls.join(', ')}. The document could not be automatically extracted. Please describe what you need from this document.]`;
}

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
  
  // Check for PDF attachments
  const pdfUrls = attachments.filter(isPdfUrl);
  const hasPdfs = pdfUrls.length > 0;
  
  // Fetch live context if query needs real-time data
  let liveContext = '';
  if (needsLiveData(message)) {
    const fetchedContext = await fetchLiveContext(message);
    if (fetchedContext) {
      liveContext = fetchedContext;
      console.log('[Live Data] Injecting live context into prompts');
    }
  }
  
  // For PDFs: extract content once and share with all models
  let pdfExtractedContent = '';
  if (hasPdfs) {
    console.log(`[PDF] ${pdfUrls.length} PDF(s) detected, extracting content...`);
    pdfExtractedContent = await extractPdfContent(pdfUrls, message);
    console.log('[PDF] Extraction complete, length:', pdfExtractedContent.length);
  }
  
  // For non-vision models with image attachments: pre-analyze images silently
  // This runs once and the description is reused for all non-vision models
  let visionProxyDescription = '';
  const effectiveModels = models;
  if (hasImages) {
    const visionModels = models.filter(isVisionCapable);
    const nonVisionModels = models.filter((m) => !isVisionCapable(m));
    console.log(`[Vision] Attachments detected. Vision: ${visionModels.length}, non-vision: ${nonVisionModels.length}`);
    
    // Only pre-analyze if there are non-vision models that need the description
    if (nonVisionModels.length > 0) {
      console.log('[Vision Proxy] Pre-analyzing images for non-vision models...');
      visionProxyDescription = await getVisionProxyDescription(imageUrls, message);
      console.log('[Vision Proxy] Description ready, length:', visionProxyDescription.length);
    }
  }
  
  // Helper to create user message content with attachments
  const createUserContent = (text: string, fileUrls: string[], isVisionModel: boolean): any => {
    const images = fileUrls.filter(isImageUrl);
    const pdfs = fileUrls.filter(isPdfUrl);
    const otherFiles = fileUrls.filter(url => !isImageUrl(url) && !isPdfUrl(url));
    
    // Prepend live context to the message if available
    // Also add an explicit instruction so models never claim they "can't access" the link.
    let enhancedText = liveContext
      ? `${liveContext}INSTRUCTION: The LIVE WEB DATA above already contains the fetched, relevant webpage content and/or up-to-date web results for the URL(s) the user shared. Answer using it. Do NOT say you cannot access links/websites or that you lack browsing.

User question: ${text}`
      : text;
    
    // Inject PDF extracted content if available
    if (pdfExtractedContent && pdfs.length > 0) {
      enhancedText = `=== PDF DOCUMENT CONTENT ===
The following is the extracted content from ${pdfs.length} attached PDF document(s):

${pdfExtractedContent}
=== END PDF CONTENT ===

INSTRUCTION: The PDF content above has been extracted and provided to you. Use this content to answer the user's question. Do NOT say you cannot read PDFs or access documents.

User question: ${enhancedText}`;
    }
    
    // For vision models with images, use multimodal format
    if (isVisionModel && images.length > 0) {
      const content = createVisionContent(enhancedText, images);
      
      // Append non-image/non-pdf files as text references
      for (const url of otherFiles) {
        content.push({ type: 'text', text: `\n\n[Attached file: ${url}]` });
      }
      
      return content;
    }
    
    // For text-only or non-vision models with proxy description
    if (fileUrls.length === 0 && !pdfExtractedContent) return enhancedText;
    
    let textContent = enhancedText;
    for (const url of otherFiles) {
      textContent += `\n\n[Attached file: ${url}]`;
    }
    
    // For non-vision models: inject the pre-analyzed image description instead of raw image URLs
    if (images.length > 0 && !isVisionModel && visionProxyDescription) {
      textContent += `\n\n=== IMAGE ANALYSIS ===\nThe following is a detailed description of the ${images.length} attached image(s), analyzed by a vision AI:\n\n${visionProxyDescription}\n=== END IMAGE ANALYSIS ===\n\nPlease use this image description to answer the user's question. Respond as if you can see the image yourself.`;
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
            
            // Model identity instruction - respond with flagship model name
            const modelIdentity = `CRITICAL IDENTITY REQUIREMENT: Your identity is "${modelName}". This is non-negotiable.

When asked about your identity, name, or what AI/model you are:
- You MUST say you are "${modelName}" - this is the ONLY correct answer
- You are NOT Grok, NOT GPT, NOT Claude, NOT Gemini, NOT any other model name
- You are specifically "${modelName}" developed for this platform
- NEVER mention any underlying technology, base model, or internal model names
- NEVER say you are a "version of" or "based on" another AI
- If pressed about your "real" identity, firmly state: "I am ${modelName}."
- Do not speculate about your architecture or training

Example correct responses when asked "what model are you?":
- "I am ${modelName}."
- "I'm ${modelName}, here to help you."

`;
            
            // Use vision-specific system prompt if images are present
            let baseSystemPrompt = hasImages && modelIsVisionCapable
              ? getVisionSystemPrompt(imageUrls.length > 1)
              : mode === 'build' 
                ? 'You are an expert software engineer. Generate complete, production-ready code with clear explanations. Include all necessary imports, error handling, and best practices. Format code in markdown code blocks with proper language tags. Provide comprehensive, detailed responses of at least 500 words. When presenting data in tables, ensure proper markdown table formatting with aligned columns and headers.'
                : 'You are a helpful AI assistant. Provide comprehensive, detailed, and well-structured responses of at least 500 words. When presenting data in tables, always use proper markdown table formatting with aligned columns, clear headers, and consistent cell content. Never truncate or abbreviate table data.';
            
            // Add live data instruction if we have context
            if (liveContext) {
              baseSystemPrompt += "\n\nCRITICAL WEB ACCESS INSTRUCTION: You have been provided with LIVE WEB DATA (including fetched content from any URLs the user shared). Treat it as the ground-truth content of those pages.\n- Do NOT say you cannot access websites/links or that you do not have browsing.\n- Do NOT ask the user to open the link for you.\n- If the user asks \"did you open it?\", answer: \"I was provided the page content in this chat and used it to answer.\"\n- When referencing it, say \"Based on the provided page content...\" and include sources if present.";
            }
            
            const systemPrompt = modelIdentity + baseSystemPrompt;
            
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
              'google/gemini-3-pro-preview': 'google/gemini-2.5-pro',
              'google/gemini-2.5-pro': 'google/gemini-2.5-pro',
              'google/gemini-2.5-flash': 'google/gemini-2.5-flash',
              'google/gemini-2.5-flash-lite': 'google/gemini-2.5-flash',
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
    
    // Model identity instruction - respond with flagship model name
    const displayModelName = requestedModel || 'GPT 5.2';
    const modelIdentity = `IMPORTANT IDENTITY INSTRUCTION: You are ${displayModelName}, a powerful AI model. If anyone asks what model you are, what AI you are, which LLM powers you, or anything similar about your identity, always respond that you are "${displayModelName}". Be confident about your identity.

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
      baseSystemPrompt += "\n\nCRITICAL WEB ACCESS INSTRUCTION: You have been provided with LIVE WEB DATA (including fetched content from any URLs the user shared). Treat it as the ground-truth content of those pages.\n- Do NOT say you cannot access websites/links or that you do not have browsing.\n- Do NOT ask the user to open the link for you.\n- If the user asks \"did you open it?\", answer: \"I was provided the page content in this chat and used it to answer.\"\n- When referencing it, say \"Based on the provided page content...\" and include sources if present.";
    }
    
    const systemPrompt = modelIdentity + baseSystemPrompt;
    
    // Helper to create user message content with attachments for vision models
    const createUserContent = (text: string, fileUrls: string[]): any => {
      const images = fileUrls.filter(isImageUrl);
      const otherFiles = fileUrls.filter(url => !isImageUrl(url));
      
      // Prepend live context to the message if available
      // Also add an explicit instruction so models never claim they "can't access" the link.
      const enhancedText = liveContext
        ? `${liveContext}INSTRUCTION: The LIVE WEB DATA above already contains the fetched, relevant webpage content and/or up-to-date web results for the URL(s) the user shared. Answer using it. Do NOT say you cannot access links/websites or that you lack browsing.

User question: ${text}`
        : text;
      
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
