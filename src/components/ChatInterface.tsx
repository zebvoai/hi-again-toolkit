import { useState, useEffect, useRef } from 'react';
import { Square } from 'lucide-react';
import { toast } from 'sonner';
import { useChat } from '@/features/chat/hooks/useChat';
import { useModeStore } from '@/features/modes/store/modeStore';
import { useChatStore } from '@/features/chat/store/chatStore';
import { Message } from '@/features/chat/components/Message';
import { MessageSkeleton } from '@/features/chat/components/MessageSkeleton';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import { ModelSelector } from '@/features/chat/components/ModelSelector';
import { ModeDropdown } from '@/features/modes/components/ModeDropdown';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useModels } from '@/features/chat/hooks/useModels';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRealtimeMessages } from '@/features/chat/hooks/useRealtimeMessages';
import { triggerHapticFeedback, triggerConfetti, updatePageTitle, smoothScrollTo } from '@/lib/microInteractions';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isTemporaryMode, setIsTemporaryMode] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isFirstResponse, setIsFirstResponse] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const {
    messages,
    sendMessage,
    isLoading,
    retryMessage,
    cancelGeneration,
    regenerateResponse,
    editAndRegenerate,
  } = useChat();
  const {
    selectedMode
  } = useModeStore();
  const {
    selectedModels,
    setSelectedModels,
    clearMessages,
    setCurrentConversationId,
  } = useChatStore();
  const {
    models
  } = useModels();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Enable realtime sync for messages across tabs
  useRealtimeMessages();

  // Update page title based on loading state
  useEffect(() => {
    updatePageTitle(isLoading ? 'generating' : 'idle');
    return () => updatePageTitle('idle');
  }, [isLoading]);

  // Trigger confetti on first AI response
  useEffect(() => {
    const hasNewAssistantMessage = messages.length > prevMessagesLengthRef.current && 
      messages[messages.length - 1]?.role === 'assistant';
    
    if (hasNewAssistantMessage && isFirstResponse && !isLoading) {
      triggerConfetti();
      setIsFirstResponse(false);
    }
    
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isFirstResponse, isLoading]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSend: () => {
      if (input.trim() && !isLoading && selectedModels.length > 0) {
        handleSendMessage();
      }
    },
    onNewChat: () => {
      clearMessages();
      setCurrentConversationId(null);
      setInput('');
      setIsFirstResponse(true);
      toast.success('New chat started');
    },
    onFocusInput: () => {
      inputRef.current?.focus();
    },
    onCopyLastResponse: () => {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistant) {
        const content = typeof lastAssistant.content === 'string' 
          ? lastAssistant.content 
          : JSON.stringify(lastAssistant.content);
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard');
      }
    },
    onCancelGeneration: cancelGeneration,
    isLoading,
  });

  // Reset selected models when mode changes
  useEffect(() => {
    if (!models) return;
    const defaultModels: Record<string, string> = {
      text: 'GPT-5',
      image: 'DALL-E 3',
      video: 'Gemini Video 2.0',
      build: 'GPT-5'
    };

    const availableModelsForMode = models[selectedMode] || [];
    const validModels = selectedModels.filter(model => availableModelsForMode.includes(model));

    if (validModels.length === 0) {
      const defaultModel = defaultModels[selectedMode] || 'GPT-5';
      setSelectedModels([defaultModel]);
    } else if (validModels.length !== selectedModels.length) {
      setSelectedModels(validModels);
    }
  }, [selectedMode, models, selectedModels, setSelectedModels]);

  // Initialize with default model if none selected
  useEffect(() => {
    if (selectedModels.length === 0) {
      setSelectedModels(['GPT-5']);
    }
  }, [selectedModels.length, setSelectedModels]);

  // Smooth scroll to new messages
  useEffect(() => {
    smoothScrollTo(messagesEndRef.current);
  }, [messages, isLoading]);

  const handleSendMessage = () => {
    // Haptic feedback on mobile
    triggerHapticFeedback(10);
    
    sendMessage(input, attachedFiles);
    setInput('');
    setAttachedFiles([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && selectedModels.length > 0) {
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
      toast.success(`${files.length} file(s) attached`);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getPlaceholder = () => {
    const basePlaceholder = (() => {
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
    })();
    return isTemporaryMode ? `${basePlaceholder} (Temporary Mode)` : basePlaceholder;
  };

  return (
    <div className="flex flex-col h-full relative bg-background overflow-hidden">
      {/* Temporary Mode Banner */}
      {isTemporaryMode && (
        <div className="px-4 pt-4">
          <Alert className="glass-panel border-primary/20 max-w-4xl mx-auto">
            <AlertDescription className="text-primary text-sm flex items-center gap-2">
              🕶️ <span className="font-medium">Temporary Chat Mode</span> — This conversation is private and won't be saved
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages Area */}
      {isLoadingConversation ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-8">
          <div className="max-w-[800px] mx-auto px-6">
            <MessageSkeleton />
          </div>
        </div>
      ) : messages.length > 0 ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 bg-gradient-to-b from-transparent via-primary/[0.01] to-transparent">
        {messages.map((message, index) => {
            const isMultiModelResponse = message.role === 'assistant' && typeof message.content === 'object' && !Array.isArray(message.content) && message.metadata?.models?.length > 1;
            const prevMessage = messages[index - 1];
            const isUserMessage = message.role === 'user';
            const nextMessage = messages[index + 1];
            const nextIsMultiModel = nextMessage?.role === 'assistant' && typeof nextMessage.content === 'object' && !Array.isArray(nextMessage.content) && nextMessage.metadata?.models?.length > 1;

            // User message followed by multi-model response - align right edge with cards
            if (isUserMessage && nextIsMultiModel) {
              return (
                <div key={message.id} className="w-full px-6 mb-1">
                  <div className="flex justify-end">
                    <Message 
                      message={message} 
                      onRetry={() => retryMessage(typeof message.content === 'string' ? message.content : '')}
                      onRegenerate={() => regenerateResponse(message.id)}
                      onEdit={(newContent) => editAndRegenerate(message.id, newContent)}
                    />
                  </div>
                </div>
              );
            }

            if (isMultiModelResponse) {
              return (
                <div key={message.id} className="w-full mb-5">
                  <Message 
                    message={message} 
                    onRetry={() => retryMessage(typeof message.content === 'string' ? message.content : '')}
                    onRegenerate={() => regenerateResponse(message.id)}
                    onEdit={(newContent) => editAndRegenerate(message.id, newContent)}
                  />
                </div>
              );
            }

            return (
              <div key={message.id} className="max-w-[800px] mx-auto px-6 mb-3">
                <Message 
                  message={message} 
                  onRetry={() => retryMessage(typeof message.content === 'string' ? message.content : '')}
                  onRegenerate={() => regenerateResponse(message.id)}
                  onEdit={(newContent) => editAndRegenerate(message.id, newContent)}
                />
              </div>
            );
          })}
          {isLoading && (
            <div className="max-w-[800px] mx-auto px-6">
              <TypingIndicator models={selectedModels} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-blue-500 mb-3 animate-logo-entrance animate-float-gentle hover:scale-[1.02] transition-transform duration-300 cursor-default">
              Zebvo AI
            </h1>
            <p className="text-muted-foreground text-base mb-6 animate-tagline-entrance">
              The World's Greatest AI Platform
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-8">
              <div className="w-2 h-2 rounded-full bg-[#5B9FFF] animate-dot-pulse-wave" />
              <div className="w-2 h-2 rounded-full bg-[#B8D4FF] animate-dot-pulse-wave" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-[#B8D4FF] animate-dot-pulse-wave" style={{ animationDelay: '0.4s' }} />
            </div>
            {/* Keyboard shortcuts hint */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘K</kbd>
                <span>Focus</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘↵</kbd>
                <span>Send</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘N</kbd>
                <span>New Chat</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chat Input Area */}
      <div className="sticky bottom-0 flex-shrink-0 p-4 pb-6 bg-background/80 backdrop-blur-xl border-t border-border/30 z-10">
        <div key={selectedMode} className="max-w-4xl mx-auto animate-scale-in">
          <form onSubmit={handleSubmit}>
            {/* Dropdowns Row */}
            <div className="flex items-center gap-2.5 mb-3">
              <ModeDropdown />
              {selectedMode !== 'video' && <ModelSelector values={selectedModels} onChange={setSelectedModels} />}
            </div>

            {/* File Attachments Preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 p-3 glass-panel rounded-[18px] border border-border/50">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 text-sm">
                      <span className="text-foreground truncate max-w-[200px]">{file.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button type="button" onClick={() => handleRemoveFile(index)} className="text-muted-foreground hover:text-foreground ml-1 transition-colors duration-[180ms]">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden File Input */}
            <input ref={fileInputRef} type="file" multiple accept="*/*" onChange={handleFileSelect} className="hidden" />

            {/* Glass Input Bar */}
            <div className="flex items-center w-full h-[60px] bg-card rounded-[50px] border border-border shadow-sm focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.1)] transition-all duration-[220ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] px-[11px]">
              {/* Left Plus Button */}
              <button type="button" onClick={triggerFileInput} className="flex-shrink-0 w-[42px] h-[42px] rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 hover:scale-[1.05] active:scale-[0.95] transition-all duration-[180ms] border border-border/50">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4V16M4 10H16" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {/* Input Field */}
              <input 
                ref={inputRef}
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Ask Zebvo ai" 
                disabled={isLoading} 
                className="flex-1 bg-transparent outline-none text-[17px] font-medium placeholder:text-muted-foreground/70 disabled:opacity-50 px-4 text-foreground" 
                maxLength={4000} 
              />

              {/* Character count */}
              {input.length > 3500 && (
                <span className={`text-xs mr-2 ${input.length > 3900 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {4000 - input.length}
                </span>
              )}

              {/* Right Send Button */}
              <button type={isLoading ? "button" : "submit"} onClick={isLoading ? cancelGeneration : undefined} disabled={!isLoading && (!input.trim() || selectedModels.length === 0)} className={`flex-shrink-0 w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isLoading ? 'bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg shadow-primary/25' : !input.trim() || selectedModels.length === 0 ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border/50' : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 hover:shadow-lg hover:shadow-primary/25 animate-scale-in'}`}>
                {isLoading ? <Square className="w-4 h-4 fill-current animate-pulse" /> : (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="transition-all duration-300">
                    <path d="M3 10L17 10M17 10L11 4M17 10L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
