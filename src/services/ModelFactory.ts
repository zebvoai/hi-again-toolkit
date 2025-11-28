import { AIProvider, ModelSelection } from '@/types/model.types';
import { InteractionMode } from '@/types/chat.types';
import { OpenAIService } from './api/OpenAIService';
import { AnthropicService } from './api/AnthropicService';
import { GoogleService } from './api/GoogleService';
import { MODELS, DEFAULT_MODELS_BY_MODE } from '@/constants/models';
import { SecureStorage } from './storage/SecureStorage';

export class ModelFactory {
  static async getServiceForProvider(provider: AIProvider): Promise<OpenAIService | AnthropicService | GoogleService | null> {
    const credentials = await SecureStorage.getApiKeys();

    switch (provider) {
      case 'openai':
        return credentials.openai ? new OpenAIService(credentials.openai) : null;
      case 'anthropic':
        return credentials.anthropic ? new AnthropicService(credentials.anthropic) : null;
      case 'google':
        return credentials.google ? new GoogleService(credentials.google) : null;
      default:
        return null;
    }
  }

  static async getDefaultModelForMode(mode: InteractionMode): Promise<ModelSelection | null> {
    const modelId = DEFAULT_MODELS_BY_MODE[mode];
    const model = MODELS.find(m => m.id === modelId);

    if (!model) return null;

    const service = await this.getServiceForProvider(model.provider);
    if (!service) return null;

    return {
      provider: model.provider,
      modelId: model.id,
      mode,
    };
  }

  static async getAvailableModelsForMode(mode: InteractionMode): Promise<ModelSelection[]> {
    const credentials = await SecureStorage.getApiKeys();
    const availableProviders: AIProvider[] = [];

    if (credentials.openai) availableProviders.push('openai');
    if (credentials.anthropic) availableProviders.push('anthropic');
    if (credentials.google) availableProviders.push('google');

    return MODELS
      .filter(model => 
        model.supportedModes.includes(mode) &&
        availableProviders.includes(model.provider)
      )
      .map(model => ({
        provider: model.provider,
        modelId: model.id,
        mode,
      }));
  }

  static getModelConfig(modelId: string) {
    return MODELS.find(m => m.id === modelId);
  }
}
