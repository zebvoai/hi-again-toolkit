import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

// Intent categories for Zebvo AI routing
type IntentType = 'web_search' | 'deep_research' | 'coding' | 'math_reasoning' | 'creative' | 'general' | 'quick_answer';

interface IntentAnalysis {
  intent: IntentType;
  confidence: number;
  requiresConfirmation: boolean;
  suggestedModel: string;
  reasoning: string;
}

// Analyze user intent to route to the best model
function analyzeIntent(message: string, conversationHistory: Message[]): IntentAnalysis {
  const msgLower = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;
  
  // Deep research indicators (requires confirmation)
  const deepResearchPatterns = [
    /research\s+(on|about|into|regarding)/i,
    /comprehensive\s+(analysis|review|study|report)/i,
    /in-depth\s+(analysis|look|examination)/i,
    /detailed\s+(report|analysis|explanation|breakdown)/i,
    /write\s+(a\s+)?(research|report|paper|essay|article)/i,
    /thorough\s+(analysis|investigation|review)/i,
    /complete\s+guide/i,
    /everything\s+(about|you\s+know)/i,
    /full\s+(breakdown|analysis|report)/i,
    /extensive\s+(research|analysis)/i,
  ];
  
  for (const pattern of deepResearchPatterns) {
    if (pattern.test(message)) {
      return {
        intent: 'deep_research',
        confidence: 0.95,
        requiresConfirmation: true,
        suggestedModel: 'Perplexity Sonar Pro',
        reasoning: 'Query requires comprehensive research with multiple sources'
      };
    }
  }
  
  // Web search indicators (current info, news, real-time data)
  const webSearchPatterns = [
    /what\s+(is|are)\s+the\s+(latest|current|recent|newest)/i,
    /news\s+(about|on|regarding)/i,
    /today('s)?\s/i,
    /this\s+(week|month|year)/i,
    /recent(ly)?\s/i,
    /update(s)?\s+(on|about)/i,
    /happening\s+(now|right\s+now)/i,
    /current\s+(price|status|situation|events)/i,
    /who\s+won/i,
    /when\s+(is|was|will|did)/i,
    /where\s+(is|can\s+i)/i,
    /how\s+much\s+(does|is|are|do)/i,
    /search\s+(for|the\s+web)/i,
    /look\s+up/i,
    /find\s+(me|out|information)/i,
    /weather/i,
    /stock\s+price/i,
    /score/i,
  ];
  
  for (const pattern of webSearchPatterns) {
    if (pattern.test(message)) {
      return {
        intent: 'web_search',
        confidence: 0.9,
        requiresConfirmation: false,
        suggestedModel: 'Perplexity Sonar',
        reasoning: 'Query requires real-time web information'
      };
    }
  }
  
  // Coding indicators
  const codingPatterns = [
    /\b(code|coding|program|programming)\b/i,
    /\b(function|class|method|api|endpoint)\b/i,
    /\b(javascript|python|typescript|java|c\+\+|rust|go|ruby|php|swift|kotlin)\b/i,
    /\b(react|vue|angular|node|django|flask|express)\b/i,
    /\b(bug|debug|error|fix|issue)\b/i,
    /\b(implement|build|create|develop)\s+(a|an|the)?\s*(app|application|website|feature|component)/i,
    /```/,
    /\b(sql|database|query|schema)\b/i,
    /\b(css|html|scss|tailwind)\b/i,
    /\b(git|github|deploy|docker|kubernetes)\b/i,
  ];
  
  for (const pattern of codingPatterns) {
    if (pattern.test(message)) {
      return {
        intent: 'coding',
        confidence: 0.85,
        requiresConfirmation: false,
        suggestedModel: 'GPT-5',
        reasoning: 'Query involves coding or technical development'
      };
    }
  }
  
  // Math/reasoning indicators
  const mathPatterns = [
    /\b(calculate|compute|solve|equation|formula)\b/i,
    /\b(math|mathematical|algebra|calculus|geometry|statistics)\b/i,
    /\b(prove|proof|theorem|hypothesis)\b/i,
    /\d+\s*[\+\-\*\/\^]\s*\d+/,
    /\b(analyze|analysis|reasoning|logic)\b/i,
    /\b(probability|percentage|ratio|fraction)\b/i,
  ];
  
  for (const pattern of mathPatterns) {
    if (pattern.test(message)) {
      return {
        intent: 'math_reasoning',
        confidence: 0.85,
        requiresConfirmation: false,
        suggestedModel: 'O3',
        reasoning: 'Query requires mathematical or logical reasoning'
      };
    }
  }
  
  // Creative writing indicators
  const creativePatterns = [
    /\b(write|compose|create)\s+(a|an|me)?\s*(story|poem|song|lyrics|script|novel)/i,
    /\b(creative|imaginative|fictional)\b/i,
    /\b(brainstorm|ideas|suggest)\b/i,
    /\b(rewrite|rephrase|paraphrase)\b/i,
  ];
  
  for (const pattern of creativePatterns) {
    if (pattern.test(message)) {
      return {
        intent: 'creative',
        confidence: 0.8,
        requiresConfirmation: false,
        suggestedModel: 'Claude Sonnet 4.5',
        reasoning: 'Query requires creative writing capabilities'
      };
    }
  }
  
  // Quick answer for simple questions (short messages)
  if (wordCount <= 8 && (msgLower.startsWith('what') || msgLower.startsWith('who') || 
      msgLower.startsWith('how') || msgLower.startsWith('why') || msgLower.startsWith('is') ||
      msgLower.startsWith('can') || msgLower.startsWith('does') || msgLower.startsWith('define'))) {
    return {
      intent: 'quick_answer',
      confidence: 0.75,
      requiresConfirmation: false,
      suggestedModel: 'GPT-5 Mini',
      reasoning: 'Simple question requiring quick response'
    };
  }
  
  // Default: general assistant
  return {
    intent: 'general',
    confidence: 0.7,
    requiresConfirmation: false,
    suggestedModel: 'GPT-5 Mini',
    reasoning: 'General query suitable for balanced model'
  };
}

// Handle Zebvo AI routing
async function handleZebvoAIRequest(
  message: string,
  conversationHistory: Message[],
  stream: boolean,
  mode: string,
  attachments: string[],
  confirmDeepResearch: boolean = false
): Promise<{ response?: Response; confirmationNeeded?: boolean; intent?: IntentAnalysis }> {
  
  const intent = analyzeIntent(message, conversationHistory);
  console.log('Zebvo AI Intent Analysis:', intent);
  
  // If deep research is needed and not confirmed, ask for confirmation
  if (intent.intent === 'deep_research' && !confirmDeepResearch) {
    return {
      confirmationNeeded: true,
      intent
    };
  }
  
  return { intent };
}

// Handle deep research requests using Perplexity Sonar Pro
async function handleDeepResearchRequest(
  message: string,
  conversationHistory: Message[],
  attachments: string[]
): Promise<Response> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  
  const deepResearchPrompt = `You are a world-class research analyst with access to real-time web search. The user has requested comprehensive, in-depth research on a topic.

Your task is to provide an EXTENSIVE, THOROUGHLY RESEARCHED response that:
1. Is at least 6,000 words long
2. Covers multiple perspectives and angles
3. Includes specific data, statistics, and facts
4. Cites sources for key claims (include URLs when available)
5. Is well-structured with clear headings and sections
6. Provides actionable insights and conclusions

Structure your response as follows:
## Executive Summary
(Brief 200-word overview)

## Background & Context
(Historical context and foundational information)

## Current State of Affairs
(What's happening now, recent developments)

## Key Findings
(Detailed analysis with multiple subsections)

## Data & Statistics
(Relevant numbers, studies, and research)

## Expert Perspectives
(Different viewpoints and expert opinions)

## Challenges & Opportunities
(Problems and potential solutions)

## Future Outlook
(Predictions and trends)

## Conclusion & Recommendations
(Actionable takeaways)

## Sources & References
(List all sources cited)

Remember: This is deep research. Be thorough, comprehensive, and cite your sources.`;

  const sanitizedHistory = conversationHistory.map(m => {
    let content = m.content;
    if (typeof content === 'object' && content !== null) {
      const values = Object.values(content);
      content = typeof values[0] === 'string' ? values[0] : '';
    }
    return { role: m.role, content: typeof content === 'string' ? content : '' };
  });

  const messages = [
    { role: 'system', content: deepResearchPrompt },
    ...sanitizedHistory,
    { role: 'user', content: message }
  ];

  console.log('Deep research request using Perplexity Sonar Pro');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lovable.dev',
      'X-Title': 'Zebvo AI Deep Research'
    },
    body: JSON.stringify({
      model: 'perplexity/sonar-pro',
      messages,
      max_tokens: 16384, // Maximum for deep research
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Deep research error:', response.status, errorText);
    throw new Error(`Deep research failed: ${response.status}`);
  }

  // Stream the response
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
      
      // Send routing info first
      const routingInfo = `data: ${JSON.stringify({ model: 'Zebvo AI → Perplexity Sonar Pro', content: '🔬 **Deep Research Mode Activated**\n\n*Analyzing sources and generating comprehensive report...*\n\n---\n\n', isRoutingInfo: true })}\n\n`;
      controller.enqueue(encoder.encode(routingInfo));
      
      try {
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
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  const sseData = `data: ${JSON.stringify({ model: 'Zebvo AI → Perplexity Sonar Pro', content })}\n\n`;
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
        console.error('Deep research streaming error:', error);
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
  attachments: string[] = [],
  confirmDeepResearch: boolean = false
): Promise<Response> {
  const encoder = new TextEncoder();
  
  // Sanitize history before processing
  const sanitizedHistory = sanitizeHistory(conversationHistory);
  
  // Check if Zebvo AI is in the models array and handle it specially
  const hasZebvoAI = models.some(m => m === 'Zebvo AI');
  const otherModels = models.filter(m => m !== 'Zebvo AI');
  
  // If Zebvo AI is selected, analyze intent and route to appropriate model
  let zebvoRoutedModel: string | null = null;
  if (hasZebvoAI) {
    const zebvoResult = await handleZebvoAIRequest(message, conversationHistory, stream, mode, attachments, confirmDeepResearch);
    
    // If deep research confirmation is needed, return early
    if (zebvoResult.confirmationNeeded && zebvoResult.intent) {
      return new Response(JSON.stringify({
        requiresConfirmation: true,
        content: `🔬 **Deep Research Mode**\n\nI've detected that your query would benefit from comprehensive, in-depth research. This will:\n- Generate a 6,000+ word detailed report\n- Include multiple sources and citations\n- Take longer than a standard response (1-2 minutes)\n\n**Query:** "${message}"\n\nWould you like me to proceed with deep research?`,
        intent: zebvoResult.intent
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If confirmed deep research, handle it
    if (confirmDeepResearch && zebvoResult.intent?.intent === 'deep_research') {
      return handleDeepResearchRequest(message, conversationHistory, attachments);
    }
    
    // Get the routed model from intent analysis
    if (zebvoResult.intent) {
      zebvoRoutedModel = zebvoResult.intent.suggestedModel;
      console.log(`[Zebvo AI] Routing to: ${zebvoRoutedModel} (Intent: ${zebvoResult.intent.intent}, Confidence: ${zebvoResult.intent.confidence})`);
    }
  }
  
  // Build final models list: routed Zebvo AI model + other selected models (deduplicated)
  const finalModels = zebvoRoutedModel 
    ? [zebvoRoutedModel, ...otherModels.filter(m => m !== zebvoRoutedModel)]
    : otherModels;
  
  // If no models to process, return error
  if (finalModels.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid models selected' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
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
          await Promise.all(finalModels.map(async (modelName) => {
            // Determine display name (show routing info for Zebvo AI)
            const displayName = (hasZebvoAI && modelName === zebvoRoutedModel) 
              ? `Zebvo AI → ${modelName}` 
              : modelName;
            
            const mapping = getModelMapping(modelName);
            const { apiModel, provider } = mapping;
            
            let apiUrl = '';
            let apiKey = '';
            let headers: Record<string, string> = {};
            let body: any = {};
            
            // Build mode gets a code-generation system prompt
            // Perplexity models have internet access and can search the web
            const isPerplexityModel = modelName.toLowerCase().includes('perplexity') || modelName.toLowerCase().includes('sonar');
            
            // Determine if model is premium (deep answers) or speed (fast answers)
            const modelLower = modelName.toLowerCase();
            const isPremiumModel = modelLower.includes('pro') || modelLower.includes('opus') || 
              modelLower.includes('sonnet') || modelLower.includes('large') || 
              modelLower.includes('gpt-5') && !modelLower.includes('nano') && !modelLower.includes('mini') ||
              modelLower.includes('o3') || modelLower.includes('deepseek r1') ||
              modelLower.includes('llama 4') || modelLower.includes('405b') ||
              modelLower.includes('nemotron') || modelLower.includes('command r+');
            
            const isSpeedModel = modelLower.includes('nano') || modelLower.includes('lite') || 
              modelLower.includes('haiku') || modelLower.includes('flash') ||
              modelLower.includes('mini') || modelLower.includes('nemo') ||
              modelLower.includes('fast') || modelLower.includes('phi-4');
            
            // Token limits: Premium = 8192, Speed = 2048, Default = 4096
            const maxTokens = isPremiumModel ? 8192 : (isSpeedModel ? 2048 : 4096);
            
            let systemPrompt = '';
            if (mode === 'build') {
              systemPrompt = isPremiumModel 
                ? 'You are an expert software engineer. Generate complete, production-ready code with thorough explanations, best practices, error handling, and comprehensive documentation. Use markdown code blocks.'
                : 'You are an expert software engineer. Generate production-ready code with clear explanations. Use markdown code blocks.';
            } else if (isPerplexityModel) {
              systemPrompt = isPremiumModel
                ? 'You are Perplexity with real-time web search. Provide comprehensive, deeply researched responses with multiple sources, detailed analysis, and thorough citations. Use markdown formatting for clarity.'
                : 'You are Perplexity with real-time web search. Provide accurate, well-sourced responses with citations. Use markdown formatting.';
            } else {
              systemPrompt = isPremiumModel
                ? 'You are an advanced AI assistant. Provide comprehensive, detailed, and well-structured responses. Include thorough explanations, multiple perspectives, and actionable insights. Use markdown formatting.'
                : 'You are a helpful AI assistant. Provide clear, well-structured responses using markdown formatting.';
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
                
                // Token limit based on model tier
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
                const sseData = `data: ${JSON.stringify({ model: displayName, content: fallbackContent, error: true })}\n\n`;
                controller.enqueue(encoder.encode(sseData));
                return;
              }
              
              // Handle non-streaming Anthropic responses
              if (provider === 'anthropic') {
                const data = await response.json();
                const content = data.content?.[0]?.text || 'No response generated.';
                const sseData = `data: ${JSON.stringify({ model: displayName, content })}\n\n`;
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
                        const sseData = `data: ${JSON.stringify({ model: displayName, content })}\n\n`;
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
              const sseData = `data: ${JSON.stringify({ model: displayName, content: fallbackContent, error: true })}\n\n`;
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
  confirmDeepResearch?: boolean; // User confirmed deep research
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, mode, conversationHistory = [], provider, model: requestedModel, models, stream = false, attachments = [], confirmDeepResearch = false }: ChatRequest = await req.json();
    
    console.log('Chat request:', { message, mode, provider, requestedModel, models, historyLength: conversationHistory.length, attachmentsCount: attachments.length, confirmDeepResearch });

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

    // ZEBVO AI - Intelligent Router
    const isZebvoAI = requestedModel === 'Zebvo AI' || (models && models.length === 1 && models[0] === 'Zebvo AI');
    
    if (isZebvoAI) {
      console.log('Zebvo AI routing engaged');
      const routingResult = await handleZebvoAIRequest(message, conversationHistory, stream, mode, attachments, confirmDeepResearch);
      
      // If deep research needs confirmation
      if (routingResult.confirmationNeeded && routingResult.intent) {
        const confirmationMessage = `🔬 **Deep Research Required**\n\nYour query requires comprehensive research with multiple sources and detailed analysis. This will generate a thorough report of 6,000+ words with citations.\n\n**Topic detected:** "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"\n\n**Estimated time:** 30-60 seconds\n\nWould you like me to proceed with deep research?`;
        
        return new Response(
          JSON.stringify({ 
            content: confirmationMessage,
            requiresConfirmation: true,
            intent: routingResult.intent,
            model: 'Zebvo AI'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Route to the suggested model
      const routedModel = routingResult.intent?.suggestedModel || 'GPT-5 Mini';
      const isDeepResearch = routingResult.intent?.intent === 'deep_research';
      
      console.log(`Zebvo AI routing to: ${routedModel} (intent: ${routingResult.intent?.intent})`);
      
      // For deep research, use special prompt and high token limit
      if (isDeepResearch) {
        return await handleDeepResearchRequest(message, conversationHistory, attachments);
      }
      
      // Route to the suggested model
      return await handleMultiModelRequest(message, [routedModel], conversationHistory, stream, mode, attachments, false);
    }

    // Handle multi-model requests (text mode only) - includes single model in array
    if (models && Array.isArray(models) && models.length >= 1) {
      console.log('Multi-model request:', models, 'attachments:', attachments.length);
      return await handleMultiModelRequest(message, models, conversationHistory, stream, mode, attachments, confirmDeepResearch);
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
    
    // Determine if model is premium (deep answers) or speed (fast answers)
    const modelLower = requestedModel?.toLowerCase() || '';
    const isPremiumModel = modelLower.includes('pro') || modelLower.includes('opus') || 
      modelLower.includes('sonnet') || modelLower.includes('large') || 
      modelLower.includes('gpt-5') && !modelLower.includes('nano') && !modelLower.includes('mini') ||
      modelLower.includes('o3') || modelLower.includes('deepseek r1') ||
      modelLower.includes('llama 4') || modelLower.includes('405b') ||
      modelLower.includes('nemotron') || modelLower.includes('command r+');
    
    const isSpeedModel = modelLower.includes('nano') || modelLower.includes('lite') || 
      modelLower.includes('haiku') || modelLower.includes('flash') ||
      modelLower.includes('mini') || modelLower.includes('nemo') ||
      modelLower.includes('fast') || modelLower.includes('phi-4');
    
    // Token limits: Premium = 8192, Speed = 2048, Default = 4096
    const maxTokens = isPremiumModel ? 8192 : (isSpeedModel ? 2048 : 4096);
    
    let systemPrompt = '';
    if (mode === 'build') {
      systemPrompt = isPremiumModel 
        ? 'You are an expert software engineer. Generate complete, production-ready code with thorough explanations, best practices, error handling, and comprehensive documentation. Use markdown code blocks.'
        : 'You are an expert software engineer. Generate production-ready code with clear explanations. Use markdown code blocks.';
    } else if (isPerplexityModel) {
      systemPrompt = isPremiumModel
        ? 'You are Perplexity with real-time web search. Provide comprehensive, deeply researched responses with multiple sources, detailed analysis, and thorough citations. Use markdown formatting for clarity.'
        : 'You are Perplexity with real-time web search. Provide accurate, well-sourced responses with citations. Use markdown formatting.';
    } else {
      systemPrompt = isPremiumModel
        ? 'You are an advanced AI assistant. Provide comprehensive, detailed, and well-structured responses. Include thorough explanations, multiple perspectives, and actionable insights. Use markdown formatting.'
        : 'You are a helpful AI assistant. Provide clear, well-structured responses using markdown formatting.';
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
        max_completion_tokens: maxTokens,
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
        max_tokens: maxTokens,
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
      
      // Token limit based on model tier
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
