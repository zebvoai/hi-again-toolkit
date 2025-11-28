import { ApiClient } from './ApiClient';
import { ChatCompletionRequest, ApiResponse } from '@/types/api.types';

export class GoogleService extends ApiClient {
  constructor(apiKey: string) {
    super('https://generativelanguage.googleapis.com/v1', apiKey);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {};
  }

  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    const googleRequest = {
      contents: request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    };

    const modelPath = request.model;
    const endpoint = `/models/${modelPath}:streamGenerateContent?key=${this.apiKey}`;

    try {
      for await (const chunk of this.streamRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(googleRequest),
      })) {
        try {
          const parsed = JSON.parse(chunk);
          const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            yield content;
          }
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }
    } catch (error) {
      console.error('Google stream error:', error);
      throw error;
    }
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ApiResponse<string>> {
    const googleRequest = {
      contents: request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
    };

    const modelPath = request.model;
    const endpoint = `/models/${modelPath}:generateContent?key=${this.apiKey}`;

    const response = await this.makeRequest<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(googleRequest),
    });

    if (!response.success) {
      return response;
    }

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return {
      success: true,
      data: content || '',
    };
  }
}
