import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatModelName(modelName: string): string {
  // Map internal/technical model names to flagship display names
  // Users should always see flagship branding, not internal fast variants
  const modelMap: Record<string, string> = {
    // OpenAI - all fast variants display as GPT-5
    'gpt-5-2025-08-07': 'GPT-5',
    'gpt-5': 'GPT-5',
    'openai/gpt-4.1-nano': 'GPT-5',
    'gpt-4.1-nano': 'GPT-5',
    'GPT 4.1 Nano': 'GPT-5',
    'GPT 5.2': 'GPT-5',
    'gpt-4-turbo': 'GPT-5',
    'gpt-4o': 'GPT-5',
    'gpt-4o-mini': 'GPT-5',
    'gpt-4': 'GPT-5',
    
    // Anthropic - all fast variants display as Claude Sonnet 4
    'claude-opus': 'Claude Sonnet 4',
    'claude-sonnet': 'Claude Sonnet 4',
    'claude-haiku': 'Claude Sonnet 4',
    'anthropic/claude-3.5-haiku': 'Claude Sonnet 4',
    'Claude Haiku 3.5': 'Claude Sonnet 4',
    
    // Google - all fast variants display as Gemini 2.5 Pro
    'gemini-2.5-flash': 'Gemini 2.5 Pro',
    'gemini-2.5-flash-lite': 'Gemini 2.5 Pro',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-1.5-pro': 'Gemini 2.5 Pro',
    'gemini-1.5-flash': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash': 'Gemini 2.5 Pro',
    'Gemini 2.5 Flash': 'Gemini 2.5 Pro',
    
    // Grok - display as Grok 3
    'x-ai/grok-3-mini-beta': 'Grok 3',
    'Grok 3 Mini': 'Grok 3',
    
    // DeepSeek - display as DeepSeek R1
    'deepseek/deepseek-chat': 'DeepSeek R1',
    'DeepSeek V3': 'DeepSeek R1',
    
    // Qwen - display as Qwen 3
    'qwen/qwen3-235b-a22b': 'Qwen 3',
    'Qwen 3 235B': 'Qwen 3',
    'Qwen 3 30B': 'Qwen 3',
    
    // Mistral - display as Mistral Large
    'mistralai/mistral-small-3.1-24b-instruct': 'Mistral Large',
    'Mistral Small 3.1': 'Mistral Large',
    'Mistral Small': 'Mistral Large',
    
    // Llama - display as Llama 4
    'meta-llama/llama-4-scout': 'Llama 4',
    'Llama 4 Scout': 'Llama 4',
    
    // MiniMax - display as MiniMax 01
    'minimax/minimax-m1': 'MiniMax 01',
    'MiniMax M1': 'MiniMax 01',
    
    // Cohere - display as Command R+
    'cohere/command-r-08-2024': 'Command R+',
    'Command R': 'Command R+',
    
    // Perplexity - display as Perplexity Pro
    'perplexity/sonar': 'Perplexity Pro',
    'Perplexity Sonar': 'Perplexity Pro',
    
    // NVIDIA - display as Nemotron Ultra
    'nvidia/llama-3.1-nemotron-70b-instruct': 'Nemotron Ultra',
    'Nemotron 70B': 'Nemotron Ultra',
    'Nemotron 49B': 'Nemotron Ultra',
    
    // Gemma - display as Gemma 3
    'google/gemma-3-27b-it': 'Gemma 3',
    'Gemma 3 27B': 'Gemma 3',
    'Gemma 3 12B': 'Gemma 3',
    
    // Image models
    'dall-e-3': 'DALL-E 3',
    'runway-gen-2': 'Runway Gen-2',
  };

  return modelMap[modelName] || modelName;
}
