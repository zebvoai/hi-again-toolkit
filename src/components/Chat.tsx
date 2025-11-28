import { useChat } from '@/hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ModeSelector } from './ModeSelector';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

export function Chat() {
  const {
    messages,
    currentMode,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    changeMode,
  } = useChat();

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold">Chat</h2>
          <ModeSelector currentMode={currentMode} onModeChange={changeMode} />
        </div>
      </div>

      {error && (
        <div className="p-4 max-w-4xl mx-auto w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <MessageList messages={messages} isStreaming={isStreaming} />

      <div className="border-t p-4 bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            disabled={isStreaming}
            currentMode={currentMode}
          />
        </div>
      </div>
    </div>
  );
}
