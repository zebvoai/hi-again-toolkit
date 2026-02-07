import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatModelName(modelName: string): string {
  // Map technical model names to user-friendly display names
  const modelMap: Record<string, string> = {
    'gpt-5-2025-08-07': 'GPT-5',
    'gpt-5': 'GPT-5',
    'openai/gpt-4.1-nano': 'GPT 5.2',
    'gpt-4.1-nano': 'GPT 5.2',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4': 'GPT-4',
    'claude-opus': 'Claude Opus',
    'claude-sonnet': 'Claude Sonnet',
    'claude-haiku': 'Claude Haiku',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'dall-e-3': 'DALL-E 3',
    'runway-gen-2': 'Runway Gen-2',
  };

  return modelMap[modelName] || modelName;
}
