import { useCallback } from 'react';
import { useChat as useChatContext } from '@/contexts/ChatContext';
import { ModelFactory } from '@/services/ModelFactory';
import { OpenAIService } from '@/services/api/OpenAIService';
import { AnthropicService } from '@/services/api/AnthropicService';
import { GoogleService } from '@/services/api/GoogleService';
import { ChatCompletionRequest, ImageGenerationRequest } from '@/types/api.types';

export function useChatActions() {
  const {
    addMessage,
    updateLastMessage,
    setStreaming,
    setError,
    clearError,
    currentMode,
    currentModel,
    messages,
  } = useChatContext();

  const sendMessage = useCallback(async (userMessage: string) => {
    try {
      clearError();
      addMessage('user', userMessage);

      const model = currentModel || ModelFactory.getDefaultModelForMode(currentMode);
      
      if (!model) {
        setError('No model selected. Please configure your API keys in settings.');
        return;
      }

      const service = ModelFactory.getServiceForProvider(model.provider);
      if (!service) {
        setError('Service not available. Please check your API keys.');
        return;
      }

      const request: ChatCompletionRequest = {
        model: model.modelId,
        messages: [
          ...messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: 'user',
            content: userMessage,
          },
        ],
        stream: true,
        maxTokens: 4096,
        temperature: 0.7,
      };

      addMessage('assistant', '');
      setStreaming(true);

      let fullResponse = '';

      if (service instanceof OpenAIService) {
        for await (const chunk of service.chatCompletionStream(request)) {
          fullResponse += chunk;
          updateLastMessage(fullResponse);
        }
      } else if (service instanceof AnthropicService) {
        for await (const chunk of service.chatCompletionStream(request)) {
          fullResponse += chunk;
          updateLastMessage(fullResponse);
        }
      } else if (service instanceof GoogleService) {
        for await (const chunk of service.chatCompletionStream(request)) {
          fullResponse += chunk;
          updateLastMessage(fullResponse);
        }
      }

      setStreaming(false);
    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setStreaming(false);
    }
  }, [
    addMessage,
    updateLastMessage,
    setStreaming,
    setError,
    clearError,
    currentMode,
    currentModel,
    messages,
  ]);

  const generateImage = useCallback(async (prompt: string) => {
    try {
      clearError();
      addMessage('user', prompt);

      const model = currentModel || ModelFactory.getDefaultModelForMode('image');
      
      if (!model) {
        setError('No image model available. Please configure OpenAI API key.');
        return;
      }

      const service = ModelFactory.getServiceForProvider(model.provider);
      if (!(service instanceof OpenAIService)) {
        setError('Image generation requires OpenAI API key.');
        return;
      }

      setStreaming(true);
      addMessage('assistant', 'Generating image...');

      const request: ImageGenerationRequest = {
        model: model.modelId,
        prompt,
        size: '1024x1024',
        quality: 'standard',
      };

      const response = await service.generateImage(request);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Image generation failed');
      }

      updateLastMessage(`![Generated Image](${response.data.url})`);
      setStreaming(false);
    } catch (error) {
      console.error('Image generation error:', error);
      setError(error instanceof Error ? error.message : 'Image generation failed');
      setStreaming(false);
    }
  }, [
    addMessage,
    updateLastMessage,
    setStreaming,
    setError,
    clearError,
    currentModel,
  ]);

  return {
    sendMessage,
    generateImage,
  };
}
