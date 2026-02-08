import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatModelName(modelName: string): string {
  // Map internal/technical model names to flagship display names
  // Users should always see flagship branding, not internal fast variants
  const modelMap: Record<string, string> = {
    // OpenAI - all fast variants display as GPT 5.2
    'gpt-5-2025-08-07': 'GPT 5.2',
    'gpt-5': 'GPT 5.2',
    'openai/gpt-4.1-nano': 'GPT 5.2',
    'gpt-4.1-nano': 'GPT 5.2',
    'GPT 4.1 Nano': 'GPT 5.2',
    'GPT 5.2': 'GPT 5.2',
    'GPT-5': 'GPT 5.2',
    'gpt-4-turbo': 'GPT 5.2',
    'gpt-4o': 'GPT 5.2',
    'gpt-4o-mini': 'GPT 5.2',
    'gpt-4': 'GPT 5.2',
    
    // Anthropic - all fast variants display as Claude Opus 4.6
    'claude-opus': 'Claude Opus 4.6',
    'claude-sonnet': 'Claude Opus 4.6',
    'claude-haiku': 'Claude Opus 4.6',
    'anthropic/claude-3.5-haiku': 'Claude Opus 4.6',
    'Claude Haiku 3.5': 'Claude Opus 4.6',
    'Claude Sonnet 4': 'Claude Opus 4.6',
    
    // Google - all fast variants display as Gemini 3 Pro
    'gemini-2.5-flash': 'Gemini 3 Pro',
    'gemini-2.5-flash-lite': 'Gemini 3 Pro',
    'gemini-2.5-pro': 'Gemini 3 Pro',
    'gemini-1.5-pro': 'Gemini 3 Pro',
    'gemini-1.5-flash': 'Gemini 3 Pro',
    'google/gemini-2.5-flash': 'Gemini 3 Pro',
    'Gemini 2.5 Flash': 'Gemini 3 Pro',
    'Gemini 2.5 Pro': 'Gemini 3 Pro',
    
    // Grok - display as Grok 4
    'x-ai/grok-3-mini-beta': 'Grok 4',
    'Grok 3 Mini': 'Grok 4',
    'Grok 3': 'Grok 4',
    
    // DeepSeek - display as DeepSeek-R1
    'deepseek/deepseek-chat': 'DeepSeek-R1',
    'DeepSeek V3': 'DeepSeek-R1',
    'DeepSeek R1': 'DeepSeek-R1',
    
    // Qwen - display as Qwen3-Max
    'qwen/qwen3-235b-a22b': 'Qwen3-Max',
    'Qwen 3 235B': 'Qwen3-Max',
    'Qwen 3 30B': 'Qwen3-Max',
    'Qwen 3': 'Qwen3-Max',
    
    // Mistral - display as Mistral Large 3
    'mistralai/mistral-small-3.1-24b-instruct': 'Mistral Large 3',
    'Mistral Small 3.1': 'Mistral Large 3',
    'Mistral Small': 'Mistral Large 3',
    'Mistral Large': 'Mistral Large 3',
    
    // MiniMax - display as MiniMax M2.1
    'minimax/minimax-m1': 'MiniMax M2.1',
    'MiniMax M1': 'MiniMax M2.1',
    'MiniMax 01': 'MiniMax M2.1',
    
    // Cohere - display as Command A
    'cohere/command-r-08-2024': 'Command A',
    'Command R': 'Command A',
    'Command R+': 'Command A',
    
    // Perplexity - display as Perplexity Sonar Pro
    'perplexity/sonar': 'Perplexity Sonar Pro',
    'Perplexity Sonar': 'Perplexity Sonar Pro',
    'Perplexity Pro': 'Perplexity Sonar Pro',
    
    // Kimi - display as Kimi K2.5
    'moonshotai/kimi-k2': 'Kimi K2.5',
    'Kimi K2': 'Kimi K2.5',
    
    // NVIDIA - display as Nemotron 3 Ultra
    'nvidia/llama-3.1-nemotron-70b-instruct': 'Nemotron 3 Ultra',
    'Nemotron 70B': 'Nemotron 3 Ultra',
    'Nemotron 49B': 'Nemotron 3 Ultra',
    'Nemotron Ultra': 'Nemotron 3 Ultra',
    
    // Gemma - display as Gemma 3 27B
    'google/gemma-3-27b-it': 'Gemma 3 27B',
    'Gemma 3 27B': 'Gemma 3 27B',
    'Gemma 3 12B': 'Gemma 3 27B',
    'Gemma 3': 'Gemma 3 27B',
    
    // Image models
    'dall-e-3': 'DALL-E 3',
    'runway-gen-2': 'Runway Gen-2',
  };

  return modelMap[modelName] || modelName;
}
