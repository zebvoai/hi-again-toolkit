import { ApiClient } from './ApiClient';
import { ChatCompletionRequest, ImageGenerationRequest, ImageGenerationResponse, ApiResponse } from '@/types/api.types';

export class OpenAIService extends ApiClient {
  constructor(apiKey: string) {
    super('https://api.openai.com/v1', apiKey);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  async *chatCompletionStream(request: ChatCompletionRequest): AsyncGenerator<string, void, unknown> {
    const streamRequest = {
      ...request,
      stream: true,
    };

    try {
      for await (const chunk of this.streamRequest('/chat/completions', {
        method: 'POST',
        body: JSON.stringify(streamRequest),
      })) {
        try {
          const parsed = JSON.parse(chunk);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          console.error('Error parsing chunk:', e);
        }
      }
    } catch (error) {
      console.error('OpenAI stream error:', error);
      throw error;
    }
  }

  async chatCompletion(request: ChatCompletionRequest): Promise<ApiResponse<string>> {
    const response = await this.makeRequest<any>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.success) {
      return response;
    }

    const content = response.data?.choices?.[0]?.message?.content;
    return {
      success: true,
      data: content || '',
    };
  }

  async generateImage(request: ImageGenerationRequest): Promise<ApiResponse<ImageGenerationResponse>> {
    const response = await this.makeRequest<any>('/images/generations', {
      method: 'POST',
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        n: 1,
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
      }),
    });

    if (!response.success) {
      return response;
    }

    return {
      success: true,
      data: {
        url: response.data?.data?.[0]?.url || '',
        revisedPrompt: response.data?.data?.[0]?.revised_prompt,
      },
    };
  }
}
