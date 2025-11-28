import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ProviderCredentials } from '@/types/model.types';
import { SecureStorage } from '@/services/storage/SecureStorage';

interface SettingsContextValue {
  credentials: ProviderCredentials;
  saveApiKey: (provider: keyof ProviderCredentials, apiKey: string) => void;
  deleteApiKey: (provider: keyof ProviderCredentials) => void;
  hasApiKey: (provider: keyof ProviderCredentials) => boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<ProviderCredentials>({});

  useEffect(() => {
    const loadedCredentials = SecureStorage.getApiKeys();
    setCredentials(loadedCredentials);
  }, []);

  const saveApiKey = useCallback((provider: keyof ProviderCredentials, apiKey: string) => {
    const updated = { ...credentials, [provider]: apiKey };
    SecureStorage.saveApiKeys(updated);
    setCredentials(updated);
  }, [credentials]);

  const deleteApiKey = useCallback((provider: keyof ProviderCredentials) => {
    SecureStorage.deleteApiKey(provider);
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
