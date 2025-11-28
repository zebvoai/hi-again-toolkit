import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

interface ChatRequest {
  message: string;
  mode: 'text' | 'image' | 'video' | 'build';
  conversationHistory: Message[];
  provider?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, mode, conversationHistory, provider }: ChatRequest = await req.json();
    
    console.log('Chat request:', { message, mode, provider });
    
    // Select model based on mode and provider
    const modelMap: Record<string, Record<string, string>> = {
      text: {
        openai: 'gpt-5-2025-08-07',
        anthropic: 'claude-sonnet-4-20250514',
        google: 'gemini-pro'
      },
      build: {
        openai: 'gpt-5-2025-08-07',
        anthropic: 'claude-sonnet-4-20250514',
        google: 'gemini-pro'
      },
      video: {
        runway: 'gen-2',
        pika: 'pika-1.0'
      }
    };
    
    const selectedProvider = provider || 'openai';
    const model = modelMap[mode]?.[selectedProvider] || 'gpt-5-2025-08-07';
    
    // Get API key based on provider
    let apiKey: string | undefined;
    let apiUrl = '';
    let headers: Record<string, string> = {};
    let body: any = {};
    
    if (selectedProvider === 'openai') {
      apiKey = Deno.env.get('OPENAI_API_KEY');
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      const messages = [
        ...conversationHistory,
        { role: 'user', content: message }
      ];
      
      body = {
        model,
        messages,
        max_completion_tokens: 4096
      };
    } else if (selectedProvider === 'anthropic') {
      apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'x-api-key': apiKey!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      };
      
      const messages = [
        ...conversationHistory.filter(m => m.role !== 'system'),
        { role: 'user', content: message }
      ];
      
      body = {
        model,
        messages,
        max_tokens: 4096
      };
    } else if (selectedProvider === 'google') {
      apiKey = Deno.env.get('GOOGLE_API_KEY');
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      headers = {
        'Content-Type': 'application/json'
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
    }
    
    if (!apiKey) {
      throw new Error(`${selectedProvider.toUpperCase()}_API_KEY not configured`);
    }
    
    console.log('Calling AI provider:', selectedProvider, model);
    
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
    
    const data = await response.json();
    console.log('AI response received');
    
    let content: string;
    if (selectedProvider === 'openai') {
      content = data.choices[0].message.content;
    } else if (selectedProvider === 'anthropic') {
      content = data.content[0].text;
    } else if (selectedProvider === 'google') {
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
