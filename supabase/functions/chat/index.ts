import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Message {
  role: string;
  content: string | any[];
}

// Keywords that indicate the user wants real-time/live data or internet access
// Made MUCH more selective to avoid unnecessary web searches that slow response time
const LIVE_DATA_KEYWORDS = [
  // Time-sensitive - EXPLICIT current events
  'today', 'current news', 'latest news', 'breaking news', 'right now',
  'this week', 'this month', 'this year',
  
  // Weather - explicit
  'weather today', 'current weather', 'weather forecast', 'weather in',
  
  // Finance - explicit
  'stock price', 'current price', 'live price', 'market today',
  'exchange rate', 'crypto price', 'bitcoin price',
  
  // Sports - explicit
  'live score', 'match result', 'game score', 'standings today',
  
  // Explicit internet requests
  'search for', 'look up online', 'find online', 'google',
  'latest on', 'news about', 'recent news',
];

// Stricter question patterns - only trigger for explicit research/lookup requests
const INTERNET_QUESTION_PATTERNS = [
  /^(what|who|where) (is|are|was|were) .{20,}/i, // Longer queries more likely need search
  /latest .{5,}/i,
  /current .{10,}/i,
  /news (about|on|regarding)/i,
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

// Check if a query needs internet/live data - OPTIMIZED for speed
// Only trigger web search for queries that REALLY need current information
const needsLiveData = (message: string): boolean => {
  const lowerMessage = message.toLowerCase().trim();
  
  // Short queries (under 15 chars) rarely need web search unless they contain URLs
  if (lowerMessage.length < 15 && !containsUrls(message)) return false;
  
  // Trigger for URLs since we need to fetch them
  if (containsUrls(message)) return true;
  
  // Check STRICT keyword matches (these are already very selective)
  if (LIVE_DATA_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) return true;
  
  // Check question patterns that typically need internet (already stricter now)
  if (INTERNET_QUESTION_PATTERNS.some(pattern => pattern.test(message))) return true;
  
  return false;
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

// Extract text content from PDF by downloading bytes and using Gemini document understanding.
// IMPORTANT: We do NOT store PDFs anywhere; we only fetch bytes transiently and return extracted text.
async function extractPdfContent(pdfUrls: string[], userMessage: string): Promise<string> {
  const googleApiKey = (Deno.env.get('GOOGLE_API_KEY') || '').trim();

  // Only process a small number of PDFs to avoid timeouts/memory spikes
  const urls = pdfUrls.slice(0, 2);
  console.log(`[PDF Extraction] Processing ${urls.length} PDF(s)`);

  if (!googleApiKey) {
    console.warn('[PDF Extraction] GOOGLE_API_KEY not configured; cannot extract PDF bytes');
    return `[PDF document attached: ${urls.join(', ')}. PDF extraction is not configured.]`;
  }

  const extractionPrompt = `Extract and return the document text from the provided PDF(s). Preserve headings and bullet structure when possible.

After extraction, provide a short 3-6 bullet summary.

User question: ${userMessage}`;

  const extractedParts: string[] = [];

  for (const url of urls) {
    try {
      // Basic safety: avoid huge downloads
      let contentLength = 0;
      try {
        const headResp = await fetch(url, { method: 'HEAD' });
        const len = headResp.headers.get('content-length');
        contentLength = len ? Number(len) : 0;
      } catch {
        // HEAD may fail on some URLs; proceed to GET with a hard cap.
      }

      const MAX_BYTES = 12 * 1024 * 1024; // 12MB
      if (contentLength && contentLength > MAX_BYTES) {
        console.warn('[PDF Extraction] PDF too large, skipping:', { url, contentLength });
        extractedParts.push(`=== PDF (${url}) ===\n[Skipped: PDF is larger than 12MB]\n`);
        continue;
      }

      const pdfResp = await fetch(url);
      if (!pdfResp.ok) {
        console.warn('[PDF Extraction] Failed to download PDF:', { url, status: pdfResp.status });
        extractedParts.push(`=== PDF (${url}) ===\n[Failed to download]\n`);
        continue;
      }

      const buf = await pdfResp.arrayBuffer();
      if (buf.byteLength > MAX_BYTES) {
        console.warn('[PDF Extraction] PDF exceeded max bytes after download, skipping:', { url, bytes: buf.byteLength });
        extractedParts.push(`=== PDF (${url}) ===\n[Skipped: PDF is larger than 12MB]\n`);
        continue;
      }

      // Convert to base64 (Deno-safe)
      const bytes = new Uint8Array(buf);
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64Pdf = btoa(binary);

      console.log('[PDF Extraction] Calling Gemini generateContent for PDF:', { url, bytes: bytes.length });

      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: extractionPrompt },
                  {
                    inline_data: {
                      mime_type: 'application/pdf',
                      data: base64Pdf,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      if (!geminiResp.ok) {
        const t = await geminiResp.text();
        console.error('[PDF Extraction] Gemini error:', geminiResp.status, t);
        extractedParts.push(`=== PDF (${url}) ===\n[Extraction failed]\n`);
        continue;
      }

      const data = await geminiResp.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n') || '';

      if (!text || text.trim().length < 50) {
        console.warn('[PDF Extraction] Gemini returned minimal text for PDF:', { url, length: text?.length || 0 });
        extractedParts.push(`=== PDF (${url}) ===\n[Minimal extractable text found]\n`);
        continue;
      }

      extractedParts.push(`=== PDF (${url}) ===\n${text.trim()}\n`);
    } catch (e) {
      console.error('[PDF Extraction] Error processing PDF:', url, e);
      extractedParts.push(`=== PDF (${url}) ===\n[Extraction error]\n`);
    }
  }

  const combined = extractedParts.join('\n');
  console.log('[PDF Extraction] Completed, total length:', combined.length);

  return combined || `[PDF document attached: ${urls.join(', ')}. The document could not be automatically extracted.]`;
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
  
  // OPTIMIZATION: Start live data fetch in parallel - don't block model calls
  // We'll check the result later and inject if available
  let liveContextPromise: Promise<string | null> | null = null;
  const shouldFetchLiveData = !hasPdfs && !hasImages && needsLiveData(message);
  
  if (shouldFetchLiveData) {
    console.log('[Live Data] Starting parallel fetch (non-blocking)...');
    liveContextPromise = fetchLiveContext(message);
  } else if (hasPdfs || hasImages) {
    console.log('[Live Data] Skipped - document/image attachments present');
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
  // Note: liveContext is now passed as parameter instead of closure variable
  const createUserContent = (text: string, fileUrls: string[], isVisionModel: boolean, liveCtx: string): any => {
    const images = fileUrls.filter(isImageUrl);
    const pdfs = fileUrls.filter(isPdfUrl);
    const otherFiles = fileUrls.filter(url => !isImageUrl(url) && !isPdfUrl(url));
    
    // Prepend live context to the message if available
    // Also add an explicit instruction so models never claim they "can't access" the link.
    let enhancedText = liveCtx
      ? `${liveCtx}INSTRUCTION: The LIVE WEB DATA above already contains the fetched, relevant webpage content and/or up-to-date web results for the URL(s) the user shared. Answer using it. Do NOT say you cannot access links/websites or that you lack browsing.

User question: ${text}`
      : text;
    
    // Inject PDF extracted content if available - this takes priority over everything else
    if (pdfExtractedContent && pdfs.length > 0) {
      enhancedText = `[CRITICAL: A PDF DOCUMENT HAS BEEN ATTACHED AND FULLY EXTRACTED BELOW]

=== EXTRACTED PDF DOCUMENT CONTENT (${pdfs.length} file(s)) ===
${pdfExtractedContent}
=== END PDF CONTENT ===

MANDATORY INSTRUCTIONS:
1. The PDF content above has been successfully extracted and is now available to you.
2. You MUST analyze and use this content to answer the user's question.
3. Do NOT say you cannot read PDFs, access documents, or that no file was uploaded.
4. The user's question "what is this" refers to the PDF document content shown above.
5. Summarize and explain what the document contains.

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
          // OPTIMIZATION: Wait for live context in parallel with initial setup
          // This reduces the blocking time significantly
          let liveContext = '';
          let didSearchWeb = false;
          
          if (liveContextPromise) {
            // Wait for live context but with a timeout to not delay too much
            try {
              const fetchedContext = await Promise.race([
                liveContextPromise,
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)) // 3 second timeout
              ]);
              if (fetchedContext) {
                liveContext = fetchedContext;
                didSearchWeb = true;
                console.log('[Live Data] Context ready, injecting into prompts');
              }
            } catch (e) {
              console.log('[Live Data] Fetch failed or timed out, proceeding without');
            }
          }
          
          // Send activity events first (before model responses start)
          // This lets the frontend know what activities are happening
          if (didSearchWeb) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ activity: 'searching_web' })}\n\n`));
          } else if (hasPdfs) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ activity: 'analyzing_pdf' })}\n\n`));
          } else if (hasImages) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ activity: 'analyzing_image' })}\n\n`));
          } else {
            // Send generating activity for normal queries
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ activity: 'generating' })}\n\n`));
          }
          
          await Promise.all(effectiveModels.map(async (modelName) => {
            const mapping = getModelMapping(modelName);
            const { apiModel, provider } = mapping;
            const modelIsVisionCapable = isVisionCapable(modelName);
            
            let apiUrl = '';
            let apiKey = '';
            let headers: Record<string, string> = {};
            let body: any = {};
            
            // Model identity instruction - only reveal when asked, use flagship name
            const modelIdentityPrefix = `[IDENTITY RULE]
- Do NOT mention your name or identity unless the user explicitly asks "what model are you?", "what AI are you?", or similar identity questions.
- Just answer questions naturally without introducing yourself.
- If asked about your identity: respond that you are "${modelName}" - a flagship AI model.
- Never say you are Grok, GPT, Claude, Gemini, DeepSeek, Mistral, LLaMA, or any other AI name.
[END IDENTITY RULE]

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
            
            // No suffix needed - identity rule at the start is sufficient
            
            const systemPrompt = modelIdentityPrefix + baseSystemPrompt;
            
            // Helper function to make API request
            const makeApiRequest = async (useProvider: string, useApiModel: string): Promise<Response> => {
              let reqUrl = '';
              let reqHeaders: Record<string, string> = {};
              let reqBody: any = {};
              
              const messages = [
                { role: 'system', content: systemPrompt },
                ...sanitizedHistory.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: createUserContent(message, attachments, modelIsVisionCapable, liveContext) }
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
    let didSearchWebSingle = false; // Track if web search was performed for single model
    const hasPdfsSingle = attachments.some(isPdfUrl);
    
    if (!hasPdfsSingle && !hasImages && needsLiveData(message)) {
      const fetchedContext = await fetchLiveContext(message);
      if (fetchedContext) {
        liveContext = fetchedContext;
        didSearchWebSingle = true;
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
    
    // Model identity instruction - only reveal when asked, use flagship name
    const displayModelName = requestedModel || 'GPT 5.2';
    const modelIdentityPrefix = `[IDENTITY RULE]
- Do NOT mention your name or identity unless the user explicitly asks "what model are you?", "what AI are you?", or similar identity questions.
- Just answer questions naturally without introducing yourself.
- If asked about your identity: respond that you are "${displayModelName}" - a flagship AI model.
- Never say you are Grok, GPT, Claude, Gemini, DeepSeek, Mistral, LLaMA, or any other AI name.
[END IDENTITY RULE]

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
    
    const systemPrompt = modelIdentityPrefix + baseSystemPrompt;
    
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
          // Send activity events first
          if (didSearchWebSingle) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ activity: 'searching_web' })}\n\n`));
          } else if (hasPdfsSingle) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ activity: 'analyzing_pdf' })}\n\n`));
          } else if (hasImages) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ activity: 'analyzing_image' })}\n\n`));
          }
          
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
