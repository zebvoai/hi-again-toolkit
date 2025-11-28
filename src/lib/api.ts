import type { Mode, Provider, Message, ChatResponse, ImageResponse, AvailableModels } from '@/types';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const api = {
  async sendMessage(
    message: string, 
    mode: Mode, 
    history: Message[],
    provider?: Provider,
    model?: string
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({
        message,
        mode,
        conversationHistory: history,
        provider,
        model
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  },
  
  async generateImage(prompt: string, provider?: Provider): Promise<ImageResponse> {
    const response = await fetch(`${API_BASE}/image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      },
      body: JSON.stringify({ prompt, provider })
    });
    
    if (!response.ok) {
      throw new Error('Image generation failed');
    }
    
    return response.json();
  },
  
  async getAvailableModels(): Promise<AvailableModels> {
    const response = await fetch(`${API_BASE}/models`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      }
    });
    return response.json();
  }
};
