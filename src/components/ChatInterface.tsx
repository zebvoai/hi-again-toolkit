import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Mic, Volume2, Paperclip, Send, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/features/chat/hooks/useChat';
import { useModeStore } from '@/features/modes/store/modeStore';
import { useChatStore } from '@/features/chat/store/chatStore';
import { Message } from '@/features/chat/components/Message';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import { ModelSelector } from '@/features/chat/components/ModelSelector';
import { ModeDropdown } from '@/features/modes/components/ModeDropdown';
import { Badge } from '@/components/ui/badge';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading, retryMessage } = useChat();
  const { selectedMode } = useModeStore();
  const { selectedModels, isModelLocked, setSelectedModels } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with default model if none selected
  useEffect(() => {
    if (selectedModels.length === 0) {
      setSelectedModels(['GPT-5']);
    }
  }, [selectedModels.length, setSelectedModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && selectedModels.length > 0) {
      sendMessage(input);
      setInput('');
    }
  };

  const getPlaceholder = () => {
    switch (selectedMode) {
      case 'image':
        return 'Describe the image you want to generate...';
      case 'video':
        return 'Describe the video you want to create...';
      case 'build':
        return 'Describe what you want to build...';
      default:
        return 'Ask anything...';
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-gray-50/50">
      {/* Messages Area */}
      {messages.length > 0 ? (
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                onRetry={() => retryMessage(typeof message.content === 'string' ? message.content : '')}
              />
            ))}
            {isLoading && <TypingIndicator models={selectedModels} />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-blue-500 mb-3">
              Zebvo AI
            </h1>
            <p className="text-muted-foreground text-base mb-6">
              The World's Greatest AI Platform
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Chat Input Area */}
      <div className="p-4 pb-6">
        <div className="max-w-4xl mx-auto">
          {isModelLocked && (
            <div className="flex justify-center mb-3">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                Model locked for this conversation
              </Badge>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="relative bg-white rounded-3xl shadow-lg border border-gray-200">
              {/* Dropdowns Row */}
              <div className="absolute -top-11 left-4 flex items-center gap-2.5">
                <ModeDropdown />
                <ModelSelector 
                  values={selectedModels} 
                  onChange={setSelectedModels}
                  disabled={isModelLocked}
                />
              </div>

              {/* Input Row */}
              <div className="flex items-center gap-2 p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </Button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isLoading ? 'AI is thinking...' : getPlaceholder()}
                  disabled={isLoading}
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground disabled:opacity-50"
                  maxLength={4000}
                />

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9"
                  >
                    <Mic className="w-5 h-5 text-muted-foreground" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9"
                  >
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9"
                  >
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                  </Button>

                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading || selectedModels.length === 0}
                    size="icon"
                    className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Bottom Info */}
          <div className="flex items-center justify-between mt-2 px-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>~0 tokens</span>
              <span>• {selectedModels.length} {selectedModels.length === 1 ? 'model' : 'models'}</span>
            </div>
            <span>{input.length}/4000</span>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <Button
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp className="w-5 h-5" />
      </Button>
    </div>
  );
}
