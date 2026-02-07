import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Message {
  role: string;
  content: string;
}

// Deep Research system prompt for comprehensive 6000+ word outputs with rich formatting
const DEEP_RESEARCH_PROMPT = `You are Zebvo AI, an expert research analyst conducting comprehensive, in-depth research. NEVER mention that you are GPT, Claude, Gemini, or any other AI model. You are exclusively Zebvo AI.

CRITICAL OUTPUT REQUIREMENTS:
- Your response MUST be at least 6000 words (approximately 6000-8000 words)
- This is a DEEP RESEARCH task - provide exhaustive, thorough analysis
- Cover every significant aspect of the topic in detail
- Include multiple perspectives, viewpoints, and expert opinions
- Provide extensive examples, case studies, and supporting evidence
- Explore nuances, edge cases, and lesser-known aspects

REQUIRED STRUCTURE:
1. ## Executive Summary
   - Key findings overview in bullet points
   - Main conclusions highlighted in **bold**
   - Critical insights table summarizing key metrics

2. ## Introduction & Background
   - Topic context and significance
   - Historical timeline or background
   - Current landscape with relevant statistics

3. ## Comprehensive Analysis
   Use multiple subsections with ### headings:
   - ### Market Overview (or relevant section name)
   - ### Key Drivers & Factors
   - ### Detailed Breakdown
   - Include **comparison tables** where relevant
   - Add bullet points for key data points
   - Use numbered lists for step-by-step processes

4. ## Data & Statistics
   - Present key data in **markdown tables**
   - Include year-over-year comparisons
   - Add trend analysis with percentages

5. ## Case Studies & Examples
   - Real-world applications with specific examples
   - Success stories and failures
   - Lessons learned in bullet format

6. ## Expert Perspectives
   - Various stakeholder viewpoints
   - Industry expert opinions (cite sources)
   - Debates and controversies

7. ## Comparative Analysis
   Present as a **markdown table**:
   | Factor | Option A | Option B | Option C |
   |--------|----------|----------|----------|
   | ... | ... | ... | ... |

8. ## Future Outlook & Predictions
   - Short-term outlook (1 year)
   - Medium-term trends (2-3 years)
   - Long-term implications (5+ years)
   - Present predictions in a timeline format

9. ## Recommendations
   Numbered action items:
   1. **Priority 1**: ...
   2. **Priority 2**: ...
   3. **Priority 3**: ...

10. ## Conclusion
    - Summary of key findings
    - Final thoughts
    - Call to action

11. ## Key Takeaways
    Present as checkmarked bullet points:
    - ✅ Takeaway 1
    - ✅ Takeaway 2
    - ✅ Takeaway 3
    (Include 10-15 actionable insights)

12. ## Sources & References
    - All sources as clickable markdown links: [Source Title](URL)
    - Organize by category if many sources

FORMATTING REQUIREMENTS (MANDATORY):
- Use ## for main sections, ### for subsections, #### for sub-subsections
- Include at least 3-5 **markdown tables** for data comparison
- Use **bold** for key terms and important findings
- Use bullet points (- ) for lists of items
- Use numbered lists (1. ) for sequential steps or rankings
- Include blockquotes (>) for expert quotes
- Add horizontal rules (---) between major sections
- Create comparison tables for pros/cons analysis
- Use inline \`code\` formatting for technical terms, numbers, or specific data points

TABLE EXAMPLES TO INCLUDE:
- Executive summary metrics table
- Statistical data tables
- Comparison/pros-cons tables
- Timeline tables for historical data
- Forecast/prediction tables

IMAGE PLACEHOLDERS:
When relevant, suggest where images would be helpful using this format:
> 📊 **[Chart: Description of what the chart should show]**
> 📈 **[Graph: Description of trend visualization]**
> 🖼️ **[Image: Description of relevant visual]**

IMPORTANT:
- Be thorough and comprehensive - this is DEEP research
- Prioritize accuracy and cite sources
- Present information in an organized, logical flow
- Make the content valuable and actionable
- ALWAYS include tables to present comparative data
- ALWAYS use proper heading hierarchy`;

// ─── Provider attempt functions ───

async function tryOpenRouterDeepResearch(messages: Message[], openrouterApiKey: string): Promise<{ content: string; provider: string } | null> {
  try {
    console.log('[Deep Research] Attempting OpenRouter perplexity/sonar-deep-research...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://assist.zebvo.ai',
        'X-Title': 'Zebvo Deep Research',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar-deep-research',
        messages,
        max_tokens: 32000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Deep Research] OpenRouter failed (${response.status}): ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim().length < 100) {
      console.warn('[Deep Research] OpenRouter returned empty/short content');
      return null;
    }

    console.log('[Deep Research] OpenRouter succeeded');
    return { content, provider: 'openrouter-sonar-deep-research' };
  } catch (err) {
    console.warn('[Deep Research] OpenRouter exception:', err);
    return null;
  }
}

async function tryPerplexityDirect(messages: Message[], perplexityApiKey: string): Promise<{ content: string; provider: string } | null> {
  try {
    console.log('[Deep Research] Attempting direct Perplexity sonar-pro...');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages,
        max_tokens: 16000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Deep Research] Perplexity direct failed (${response.status}): ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim().length < 100) {
      console.warn('[Deep Research] Perplexity returned empty/short content');
      return null;
    }

    console.log('[Deep Research] Perplexity direct succeeded');
    return { content, provider: 'perplexity-sonar-pro' };
  } catch (err) {
    console.warn('[Deep Research] Perplexity exception:', err);
    return null;
  }
}

async function tryGeminiFallback(messages: Message[], lovableApiKey: string): Promise<{ content: string; provider: string } | null> {
  try {
    console.log('[Deep Research] Attempting Gemini fallback via Lovable AI...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages,
        max_tokens: 32000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Deep Research] Gemini fallback failed (${response.status}): ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim().length < 100) {
      console.warn('[Deep Research] Gemini returned empty/short content');
      return null;
    }

    console.log('[Deep Research] Gemini fallback succeeded');
    return { content, provider: 'gemini-2.5-pro' };
  } catch (err) {
    console.warn('[Deep Research] Gemini exception:', err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, conversationHistory = [] } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Deep Research] Starting research for: ${prompt.substring(0, 100)}...`);

    // Build messages
    const messages: Message[] = [
      { role: 'system', content: DEEP_RESEARCH_PROMPT },
    ];

    if (conversationHistory.length > 0) {
      for (const msg of conversationHistory.slice(-4)) {
        if (msg.content && typeof msg.content === 'string') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({
      role: 'user',
      content: `Conduct comprehensive deep research on the following topic. Provide a detailed, well-structured response of at least 6000 words with proper citations and sources:\n\n${prompt}`,
    });

    // ─── Fallback chain: OpenRouter → Perplexity Direct → Gemini ───

    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    let result: { content: string; provider: string } | null = null;

    // 1. Try OpenRouter (sonar-deep-research)
    if (openrouterApiKey) {
      result = await tryOpenRouterDeepResearch(messages, openrouterApiKey);
    } else {
      console.warn('[Deep Research] OPENROUTER_API_KEY not configured, skipping');
    }

    // 2. Fallback: Direct Perplexity (sonar-pro)
    if (!result && perplexityApiKey) {
      result = await tryPerplexityDirect(messages, perplexityApiKey);
    } else if (!result) {
      console.warn('[Deep Research] PERPLEXITY_API_KEY not configured, skipping');
    }

    // 3. Fallback: Gemini via Lovable AI
    if (!result && lovableApiKey) {
      result = await tryGeminiFallback(messages, lovableApiKey);
    } else if (!result) {
      console.warn('[Deep Research] LOVABLE_API_KEY not configured, skipping');
    }

    // If all providers failed
    if (!result) {
      console.error('[Deep Research] All providers failed');
      return new Response(
        JSON.stringify({ error: 'All research providers are currently unavailable. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the response
    const content = result.content;
    const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;
    console.log(`[Deep Research] Response via ${result.provider}: ${wordCount} words`);

    let formattedContent = content;
    // Append sources section if not present
    if (!content.includes('## Sources')) {
      // No additional citations to add from the response
    }

    return new Response(
      JSON.stringify({
        content: formattedContent,
        model: 'Zebvo Deep Research',
        synthesized: true,
        modelsUsed: [result.provider],
        wordCount,
        citationsCount: 0,
        citations: [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Deep Research] Critical error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
