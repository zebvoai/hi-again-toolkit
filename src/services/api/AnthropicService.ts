import { ApiClient } from './ApiClient';
import { ChatCompletionRequest, ApiResponse } from '@/types/api.types';

export class AnthropicService extends ApiClient {
  constructor(apiKey: string) {
    super('https://api.anthropic.com/v1', apiKey);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    const anthropicRequest = {
      model: request.model,
      messages: request.messages,
      max_tokens: request.maxTokens || 4096,
      stream: true,
    };

    try {
      for await (const chunk of this.streamRequest('/messages', {
        method: 'POST',
        body: JSON.stringify(anthropicRequest),
      })) {
        try {
          const parsed = JSON.parse(chunk);
          if (parsed.type === 'content_block_delta') {
            const content = parsed.delta?.text;
            if (content) {
              yield content;
            }
          }
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }
    } catch (error) {
      console.error('Anthropic stream error:', error);
      throw error;
    }
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ApiResponse<string>> {
    const anthropicRequest = {
      model: request.model,
      messages: request.messages,
      max_tokens: request.maxTokens || 4096,
    };

    const response = await this.makeRequest<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(anthropicRequest),
    });

    if (!response.success) {
      return response;
    }

    const content = response.data?.content?.[0]?.text;
    return {
      success: true,
      data: content || '',
    };
  }
}
