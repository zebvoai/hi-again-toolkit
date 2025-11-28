import { ProviderCredentials } from '@/types/model.types';
import { encryptApiKey, decryptApiKey } from '@/utils/encryption';

const STORAGE_KEYS = {
  API_KEYS: 'zebvo_api_keys',
  CHAT_HISTORY: 'zebvo_chat_history',
  SETTINGS: 'zebvo_settings',
};

export class SecureStorage {
  static saveApiKeys(credentials: ProviderCredentials): void {
    try {
      const encrypted: Record<string, string> = {};
      
      if (credentials.openai) {
        encrypted.openai = encryptApiKey(credentials.openai);
      }
      if (credentials.anthropic) {
        encrypted.anthropic = encryptApiKey(credentials.anthropic);
      }
      if (credentials.google) {
        encrypted.google = encryptApiKey(credentials.google);
      }

      localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Failed to save API keys:', error);
      throw new Error('Failed to save API keys securely');
    }
  }

  static getApiKeys(): ProviderCredentials {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_KEYS);
      if (!stored) return {};

      const encrypted = JSON.parse(stored);
      const decrypted: ProviderCredentials = {};

      if (encrypted.openai) {
        decrypted.openai = decryptApiKey(encrypted.openai);
      }
      if (encrypted.anthropic) {
        decrypted.anthropic = decryptApiKey(encrypted.anthropic);
      }
      if (encrypted.google) {
        decrypted.google = decryptApiKey(encrypted.google);
      }

      return decrypted;
    } catch (error) {
      console.error('Failed to retrieve API keys:', error);
      return {};
    }
  }

  static deleteApiKey(provider: keyof ProviderCredentials): void {
    try {
      const credentials = this.getApiKeys();
      delete credentials[provider];
      this.saveApiKeys(credentials);
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  }

  static clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  static hasApiKey(provider: keyof ProviderCredentials): boolean {
    const keys = this.getApiKeys();
    return !!keys[provider];
  }
}
