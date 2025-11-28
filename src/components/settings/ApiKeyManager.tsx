import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { AIProvider } from '@/types/model.types';
import { validateApiKey } from '@/utils/validators';
import { maskApiKey } from '@/utils/encryption';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PROVIDERS: { id: AIProvider; name: string; placeholder: string }[] = [
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-...' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-...' },
  { id: 'google', name: 'Google', placeholder: 'AIza...' },
];

export function ApiKeyManager() {
  const { credentials, saveApiKey, deleteApiKey, hasApiKey } = useSettings();
  const [showKeys, setShowKeys] = useState<Record<AIProvider, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
  });
  const [editMode, setEditMode] = useState<Record<AIProvider, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
  });
  const [inputValues, setInputValues] = useState<Record<AIProvider, string>>({
    openai: '',
    anthropic: '',
    google: '',
  });
  const { toast } = useToast();

  const handleSave = (provider: AIProvider) => {
    const apiKey = inputValues[provider].trim();
    
    if (!validateApiKey(provider, apiKey)) {
      toast({
        variant: 'destructive',
        title: 'Invalid API key',
        description: `Please enter a valid ${PROVIDERS.find(p => p.id === provider)?.name} API key`,
      });
      return;
    }

    saveApiKey(provider, apiKey);
    setEditMode({ ...editMode, [provider]: false });
    setInputValues({ ...inputValues, [provider]: '' });
    
    toast({
      title: 'API key saved',
      description: `${PROVIDERS.find(p => p.id === provider)?.name} API key has been saved securely`,
    });
  };

  const handleDelete = (provider: AIProvider) => {
    deleteApiKey(provider);
    toast({
      title: 'API key deleted',
      description: `${PROVIDERS.find(p => p.id === provider)?.name} API key has been removed`,
    });
  };

  const handleCancel = (provider: AIProvider) => {
    setEditMode({ ...editMode, [provider]: false });
    setInputValues({ ...inputValues, [provider]: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">API Key Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure your API keys to use different AI models. Keys are stored securely in your browser.
        </p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const isConfigured = hasApiKey(provider.id);
          const isEditing = editMode[provider.id];
          const isVisible = showKeys[provider.id];

          return (
            <div key={provider.id} className="space-y-2">
              <Label htmlFor={provider.id}>{provider.name}</Label>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Input
                      id={provider.id}
                      type={isVisible ? 'text' : 'password'}
                      placeholder={provider.placeholder}
                      value={inputValues[provider.id]}
                      onChange={(e) =>
                        setInputValues({ ...inputValues, [provider.id]: e.target.value })
                      }
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setShowKeys({ ...showKeys, [provider.id]: !isVisible })}
                    >
                      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="default"
                      onClick={() => handleSave(provider.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleCancel(provider.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : isConfigured ? (
                  <>
                    <Input
                      value={maskApiKey(credentials[provider.id] || '')}
                      disabled
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setEditMode({ ...editMode, [provider.id]: true })}
                    >
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(provider.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setEditMode({ ...editMode, [provider.id]: true })}
                  >
                    Add {provider.name} API Key
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
