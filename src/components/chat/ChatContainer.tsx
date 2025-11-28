import { useChat } from '@/contexts/ChatContext';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModeSelector } from '../mode-selector/ModeSelector';
import { ModelSelector } from '../model-selector/ModelSelector';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { ApiKeyManager } from '../settings/ApiKeyManager';

export function ChatContainer() {
  const { messages } = useChat();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-primary">Zebvo AI</h1>
          <ModeSelector />
          <ModelSelector />
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="rounded-lg p-2 hover:bg-accent transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 text-foreground" />
        </button>
      </header>

      {showSettings && (
        <div className="border-b border-border bg-muted/50 p-6">
          <ApiKeyManager />
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <h2 className="mb-2 text-4xl font-bold text-primary">Zebvo AI</h2>
            <p className="mb-8 text-muted-foreground">The World's Greatest AI Platform</p>
            <div className="flex gap-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
