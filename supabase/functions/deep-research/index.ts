import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Message {
  role: string;
  content: string;
}

// Deep Research system prompt for comprehensive 6000+ word outputs
const DEEP_RESEARCH_PROMPT = `You are an expert research analyst conducting comprehensive, in-depth research.

CRITICAL OUTPUT REQUIREMENTS:
- Your response MUST be at least 6000 words (approximately 6000-8000 words)
- This is a DEEP RESEARCH task - provide exhaustive, thorough analysis
- Cover every significant aspect of the topic in detail
- Include multiple perspectives, viewpoints, and expert opinions
- Provide extensive examples, case studies, and supporting evidence
- Explore nuances, edge cases, and lesser-known aspects

REQUIRED STRUCTURE:
1. **Executive Summary** (300-400 words)
   - Key findings overview
   - Main conclusions
   - Critical insights

2. **Introduction & Background** (500-700 words)
   - Topic context and significance
   - Historical background
   - Current landscape

3. **Comprehensive Analysis** (3000-4000 words)
   - Multiple detailed sections with clear headings
   - In-depth exploration of each major aspect
   - Supporting data, statistics, and evidence
   - Expert opinions and citations
   - Comparative analysis where relevant

4. **Case Studies & Examples** (800-1000 words)
   - Real-world applications
   - Success stories and failures
   - Lessons learned

5. **Different Perspectives** (500-700 words)
   - Various stakeholder viewpoints
   - Debates and controversies
   - Pros and cons analysis

6. **Future Outlook & Implications** (400-500 words)
   - Trends and predictions
   - Potential developments
   - Recommendations

7. **Conclusion** (300-400 words)
   - Summary of key findings
   - Final thoughts
   - Call to action if relevant

8. **Key Takeaways** (bullet points)
   - 10-15 actionable insights

9. **Sources & References**
   - All sources as clickable markdown links

FORMATTING GUIDELINES:
- Use clear markdown headings (##, ###)
- Include bullet points and numbered lists for readability
- Add emphasis with **bold** for key terms
- Create tables for comparative data when useful
- Ensure all source URLs are clickable: [Source Title](URL)

IMPORTANT:
- Be thorough and comprehensive - this is DEEP research
- Prioritize accuracy and cite sources
- Present information in an organized, logical flow
- Make the content valuable and actionable`;

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

    console.log(`[Deep Research] Starting Perplexity research for: ${prompt.substring(0, 100)}...`);

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      console.error('[Deep Research] PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured. Please connect Perplexity in settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare messages for Perplexity
    const messages: Message[] = [
      { role: 'system', content: DEEP_RESEARCH_PROMPT },
    ];

    // Add conversation history if any
    if (conversationHistory.length > 0) {
      for (const msg of conversationHistory.slice(-4)) { // Last 4 messages for context
        if (msg.content && typeof msg.content === 'string') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add the main research query
    messages.push({
      role: 'user',
      content: `Conduct comprehensive deep research on the following topic. Provide a detailed, well-structured response of at least 6000 words with proper citations and sources:\n\n${prompt}`,
    });

    console.log('[Deep Research] Calling Perplexity sonar-deep-research...');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-deep-research',
        messages,
        max_tokens: 32000, // Maximum for comprehensive output
        temperature: 0.3, // Lower for factual accuracy
        return_citations: true,
        return_related_questions: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Deep Research] Perplexity API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient Perplexity credits. Please check your account.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Research failed: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];
    
    // Calculate word count
    const wordCount = content.split(/\s+/).filter((w: string) => w.length > 0).length;
    console.log(`[Deep Research] Response received: ${wordCount} words, ${citations.length} citations`);

    // Format citations as clickable sources
    let formattedContent = content;
    if (citations.length > 0 && !content.includes('## Sources')) {
      formattedContent += '\n\n## Sources\n\n';
      citations.forEach((citation: string, index: number) => {
        formattedContent += `${index + 1}. [Source ${index + 1}](${citation})\n`;
      });
    }

    return new Response(
      JSON.stringify({
        content: formattedContent,
        model: 'Perplexity Deep Research',
        synthesized: true,
        modelsUsed: ['sonar-deep-research'],
        wordCount,
        citationsCount: citations.length,
        citations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Deep Research] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
