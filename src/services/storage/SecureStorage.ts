import { ProviderCredentials } from '@/types/model.types';
import { encryptApiKey, decryptApiKey } from '@/utils/encryption';
import { supabase } from '@/integrations/supabase/client';

export class SecureStorage {
  static async saveApiKey(provider: string, apiKey: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const encryptedKey = encryptApiKey(apiKey);

      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          provider,
          encrypted_key: encryptedKey,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw new Error('Failed to save API key securely');
    }
  }

  static async getApiKeys(): Promise<ProviderCredentials> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const credentials: ProviderCredentials = {};
      data?.forEach((row) => {
        const provider = row.provider as keyof ProviderCredentials;
        credentials[provider] = decryptApiKey(row.encrypted_key);
      });

      return credentials;
    } catch (error) {
      console.error('Failed to retrieve API keys:', error);
      return {};
    }
  }

  static async deleteApiKey(provider: keyof ProviderCredentials): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw error;
    }
  }

  static async hasApiKey(provider: keyof ProviderCredentials): Promise<boolean> {
    const keys = await this.getApiKeys();
    return !!keys[provider];
  }
}
