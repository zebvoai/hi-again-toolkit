import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ProviderCredentials } from '@/types/model.types';
import { SecureStorage } from '@/services/storage/SecureStorage';
import { useAuth } from './AuthContext';

interface SettingsContextValue {
  credentials: ProviderCredentials;
  saveApiKey: (provider: keyof ProviderCredentials, apiKey: string) => Promise<void>;
  deleteApiKey: (provider: keyof ProviderCredentials) => Promise<void>;
  hasApiKey: (provider: keyof ProviderCredentials) => boolean;
  loadingCredentials: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<ProviderCredentials>({});
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  useEffect(() => {
    const loadCredentials = async () => {
      if (!user) {
        setCredentials({});
        setLoadingCredentials(false);
        return;
      }

      setLoadingCredentials(true);
      const loadedCredentials = await SecureStorage.getApiKeys();
      setCredentials(loadedCredentials);
      setLoadingCredentials(false);
    };

    loadCredentials();
  }, [user]);

  const saveApiKey = useCallback(async (provider: keyof ProviderCredentials, apiKey: string) => {
    await SecureStorage.saveApiKey(provider, apiKey);
    const updated = { ...credentials, [provider]: apiKey };
    setCredentials(updated);
  }, [credentials]);

  const deleteApiKey = useCallback(async (provider: keyof ProviderCredentials) => {
    await SecureStorage.deleteApiKey(provider);
    const updated = { ...credentials };
    delete updated[provider];
    setCredentials(updated);
  }, [credentials]);

  const hasApiKey = useCallback((provider: keyof ProviderCredentials) => {
    return !!credentials[provider];
  }, [credentials]);

  const value: SettingsContextValue = {
    credentials,
    saveApiKey,
    deleteApiKey,
    hasApiKey,
    loadingCredentials,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
