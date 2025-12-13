import { useState, useEffect, useRef } from 'react';
import { Square, Menu } from 'lucide-react';
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
import { useSidebar } from '@/components/ui/sidebar';

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
    currentConversationId,
    loadingConversationId,
  } = useChatStore();
  
  // Only show loading if current conversation is the one loading
  const isCurrentConversationLoading = isLoading && loadingConversationId === currentConversationId;
  const {
    models
  } = useModels();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Enable realtime sync for messages across tabs
  useRealtimeMessages();
  
  // Sidebar control
  const { setOpenMobile, isMobile, state } = useSidebar();
  const isSidebarExpanded = state === 'expanded';

  // Update page title based on loading state
  useEffect(() => {
    updatePageTitle(isCurrentConversationLoading ? 'generating' : 'idle');
    return () => updatePageTitle('idle');
  }, [isCurrentConversationLoading]);

  // Trigger confetti on first AI response
  useEffect(() => {
    const hasNewAssistantMessage = messages.length > prevMessagesLengthRef.current && 
      messages[messages.length - 1]?.role === 'assistant';
    
    if (hasNewAssistantMessage && isFirstResponse && !isCurrentConversationLoading) {
      triggerConfetti();
      setIsFirstResponse(false);
    }
    
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isFirstResponse, isCurrentConversationLoading]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSend: () => {
      if (input.trim() && !isCurrentConversationLoading && selectedModels.length > 0) {
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
    triggerHapticFeedback('light');
    
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
      {/* Mobile Menu Button - Only visible on mobile */}
      {isMobile && (
        <button 
          onClick={() => setOpenMobile(true)}
          className="fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border/30 shadow-sm md:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      )}
      
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

      {/* Messages Area - with bottom padding for fixed input */}
      {isLoadingConversation ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 pb-[240px]">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <MessageSkeleton />
          </div>
        </div>
      ) : messages.length > 0 ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 sm:py-6 pb-[240px]">
          <div className="space-y-4 stagger-children">
            {messages.map((message, index) => {
              const isMultiModelResponse = message.role === 'assistant' && 
                typeof message.content === 'object' && 
                !Array.isArray(message.content) && 
                message.metadata?.models?.length > 1;
              const isUserMessage = message.role === 'user';
              const nextMessage = messages[index + 1];
              const nextIsMultiModel = nextMessage?.role === 'assistant' && 
                typeof nextMessage.content === 'object' && 
                !Array.isArray(nextMessage.content) && 
                nextMessage.metadata?.models?.length > 1;
              const prevMessage = messages[index - 1];
              const prevIsMultiModel = prevMessage?.role === 'assistant' &&
                typeof prevMessage.content === 'object' &&
                !Array.isArray(prevMessage.content) &&
                prevMessage.metadata?.models?.length > 1;

              // If this is a multi-model response that is identical to the previous one,
              // skip rendering to avoid duplicate rows in the UI
              if (isMultiModelResponse && prevIsMultiModel) {
                const normalizeModels = (modelsArray: string[] = []) =>
                  [...modelsArray].sort().join('|');

                const normalizeContent = (content: unknown) => {
                  if (!content || typeof content !== 'object' || Array.isArray(content)) {
                    return JSON.stringify(content);
                  }
                  const entries = Object.entries(content as Record<string, unknown>)
                    .sort(([a], [b]) => a.localeCompare(b));
                  return JSON.stringify(entries);
                };

                const currModels = message.metadata?.models || [];
                const prevModels = prevMessage!.metadata?.models || [];
                const sameModels = normalizeModels(currModels) === normalizeModels(prevModels);
                const sameContent = normalizeContent(message.content) === normalizeContent(prevMessage!.content);

                if (sameModels && sameContent) {
                  return null;
                }
              }

              // All messages use full width with consistent padding
              return (
                <div key={message.id} className="w-full px-4 sm:px-6 lg:px-8">
                  <Message 
                    message={message} 
                    onRetry={() => retryMessage(typeof message.content === 'string' ? message.content : '')}
                    onRegenerate={() => regenerateResponse(message.id)}
                    onEdit={(newContent) => editAndRegenerate(message.id, newContent)}
                  />
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isCurrentConversationLoading && selectedModels.length === 1 && (
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <TypingIndicator models={selectedModels} />
              </div>
            )}
          </div>
          <div ref={messagesEndRef} className="h-[136px]" />
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center px-4 pb-[240px]">
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

      {/* Chat Input Area - Fixed at bottom, full width, responsive */}
      <div 
        className="fixed bottom-0 right-0 z-30 bg-background border-t border-border/20 transition-[left] duration-300"
        style={{ left: isMobile ? 0 : (isSidebarExpanded ? 280 : 60) }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <form onSubmit={handleSubmit} key={selectedMode} className="animate-scale-in">
            {/* Dropdowns Row */}
            <div className="flex items-center gap-2.5 mb-3">
              <ModeDropdown />
              {selectedMode !== 'video' && <ModelSelector values={selectedModels} onChange={setSelectedModels} />}
            </div>

            {/* File Attachments Preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 p-3 bg-card rounded-[18px] border border-border/50">
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

            {/* Glass Input Bar - Full width */}
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
                disabled={isCurrentConversationLoading} 
                className="flex-1 min-w-0 bg-transparent outline-none text-[17px] font-medium placeholder:text-muted-foreground/70 disabled:opacity-50 px-4 text-foreground"
                maxLength={4000} 
              />

              {/* Character count */}
              {input.length > 3500 && (
                <span className={`text-xs mr-2 ${input.length > 3900 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {4000 - input.length}
                </span>
              )}

              {/* Right Send Button */}
              <button type={isCurrentConversationLoading ? "button" : "submit"} onClick={isCurrentConversationLoading ? cancelGeneration : undefined} disabled={!isCurrentConversationLoading && (!input.trim() || selectedModels.length === 0)} className={`flex-shrink-0 w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isCurrentConversationLoading ? 'bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg shadow-primary/25' : !input.trim() || selectedModels.length === 0 ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border/50' : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 hover:shadow-lg hover:shadow-primary/25 animate-scale-in'}`}>
                {isCurrentConversationLoading ? <Square className="w-4 h-4 fill-current animate-pulse" /> : (
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
