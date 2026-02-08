import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Square, Menu, Share, Pencil, Trash2, MoreVertical, MessageSquare, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useChat } from '@/features/chat/hooks/useChat';
import { useModeStore } from '@/features/modes/store/modeStore';
import { useChatStore } from '@/features/chat/store/chatStore';
import { MessageList } from '@/features/chat/components/MessageList';
import { MessageSkeleton } from '@/features/chat/components/MessageSkeleton';
import { DeepResearchInlineLoader } from '@/features/chat/components/DeepResearchInlineLoader';
import { DeepResearchConfirmDialog } from '@/features/chat/components/DeepResearchConfirmDialog';
import { TextResponseSkeleton } from '@/features/chat/components/TextResponseSkeleton';
import { ImageResponseSkeleton } from '@/features/chat/components/ImageResponseSkeleton';
import { ModelRail } from '@/features/chat/components/ModelRail';
import { ModeDropdown } from '@/features/modes/components/ModeDropdown';
import { AspectRatioSelector } from '@/features/chat/components/AspectRatioSelector';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { RenameDialog } from '@/components/RenameDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useModels } from '@/features/chat/hooks/useModels';
import { useConversations } from '@/features/chat/hooks/useConversations';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useImagePaste } from '@/hooks/useImagePaste';
import { useRealtimeMessages } from '@/features/chat/hooks/useRealtimeMessages';
import { useTabFocusReload } from '@/features/chat/hooks/useTabFocusReload';
import { triggerHapticFeedback, triggerConfetti, updatePageTitle, smoothScrollTo } from '@/lib/microInteractions';
import { exportAsMarkdown, exportAsJSON } from '@/lib/exportConversation';
import { useSidebar } from '@/components/ui/sidebar';
import { ChatInput, type ChatInputHandle } from '@/components/ChatInput';
import { formatModelName } from '@/lib/utils';

export function ChatInterface() {
  const [hasInputContent, setHasInputContent] = useState(false);
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
    researchStatus,
    researchPhase,
    researchProgress,
    researchElapsedTime
  } = useChat();
  const { selectedMode } = useModeStore();

  // Use granular selectors to avoid re-renders from unrelated store changes
  const selectedModels = useChatStore((s) => s.selectedModels);
  const setSelectedModels = useChatStore((s) => s.setSelectedModels);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const setCurrentConversationId = useChatStore((s) => s.setCurrentConversationId);
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const loadingConversationId = useChatStore((s) => s.loadingConversationId);
  const selectedAspectRatio = useChatStore((s) => s.selectedAspectRatio);
  const setSelectedAspectRatio = useChatStore((s) => s.setSelectedAspectRatio);
  const currentGeneratingModel = useChatStore((s) => s.currentGeneratingModel);

  // Conversation actions
  const {
    conversations,
    deleteConversation,
    renameConversation,
    shareConversation
  } = useConversations();
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showDeepResearchConfirm, setShowDeepResearchConfirm] = useState(false);

  // Get current conversation title
  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const currentTitle = currentConversation?.title || 'Untitled';

  // Show loading if current conversation is the one loading, OR if it's a new conversation (optimistic)
  const isCurrentConversationLoading = isLoading && (
    loadingConversationId === currentConversationId ||
    (loadingConversationId === 'optimistic' && currentConversationId === null)
  );
  const { models } = useModels();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Enable realtime sync for messages across tabs
  useRealtimeMessages();
  useTabFocusReload();

  // Drag-drop and clipboard paste for images
  const handleImagesAdded = useCallback((files: File[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
  }, []);
  
  const { isDragging } = useImagePaste({
    onImagesAdded: handleImagesAdded,
    enabled: true,
  });

  // Sidebar control
  const { setOpenMobile, isMobile, state } = useSidebar();
  const isSidebarExpanded = state === 'expanded';

  // Conversation action handlers
  const handleRename = () => setShowRenameDialog(true);
  const handleRenameSubmit = (newName: string) => {
    if (currentConversationId) renameConversation(currentConversationId, newName);
    setShowRenameDialog(false);
  };
  const handleShare = () => {
    if (currentConversationId) shareConversation(currentConversationId);
  };
  const handleDuplicate = () => toast.info('Duplicate feature coming soon');
  const handleExportMarkdown = () => {
    if (messages.length > 0) {
      exportAsMarkdown(messages, currentTitle);
      toast.success('Exported as Markdown');
    }
  };
  const handleExportJSON = () => {
    if (messages.length > 0) {
      exportAsJSON(messages, currentTitle);
      toast.success('Exported as JSON');
    }
  };
  const handleArchive = () => toast.info('Archive feature coming soon');
  const handleDelete = () => setShowDeleteDialog(true);
  const confirmDelete = () => {
    if (currentConversationId) {
      deleteConversation(currentConversationId);
      clearMessages();
      setCurrentConversationId(null);
      toast.success('Conversation deleted');
    }
    setShowDeleteDialog(false);
  };

  // Update page title based on loading state
  useEffect(() => {
    updatePageTitle(isCurrentConversationLoading ? 'generating' : 'idle');
    return () => updatePageTitle('idle');
  }, [isCurrentConversationLoading]);

  // Trigger confetti on first AI response
  useEffect(() => {
    const hasNewAssistantMessage = messages.length > prevMessagesLengthRef.current && messages[messages.length - 1]?.role === 'assistant';
    if (hasNewAssistantMessage && isFirstResponse && !isCurrentConversationLoading) {
      triggerConfetti();
      setIsFirstResponse(false);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isFirstResponse, isCurrentConversationLoading]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSend: () => {
      const val = inputRef.current?.getValue() || '';
      if (val.trim() && !isCurrentConversationLoading && selectedModels.length > 0) {
        handleSendMessage(val);
      }
    },
    onNewChat: () => {
      clearMessages();
      setCurrentConversationId(null);
      inputRef.current?.clear();
      setIsFirstResponse(true);
      toast.success('New chat started');
    },
    onFocusInput: () => inputRef.current?.focus(),
    onCopyLastResponse: () => {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistant) {
        const content = typeof lastAssistant.content === 'string' ? lastAssistant.content : JSON.stringify(lastAssistant.content);
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard');
      }
    },
    onCancelGeneration: cancelGeneration,
    isLoading
  });

  // Track previous mode to detect mode switches
  const prevModeRef = useRef(selectedMode);

  // Handle model selection when mode changes
  useEffect(() => {
    if (!models) return;
    const prevMode = prevModeRef.current;
    prevModeRef.current = selectedMode;

    if (selectedMode === 'text' && models.text && models.text.length > 0) {
      const validTextModels = selectedModels.filter(model => models.text!.includes(model));
      if (validTextModels.length === 0) setSelectedModels([...models.text]);
      return;
    }

    if (selectedMode === 'image' && models.image && models.image.length > 0) {
      const validImageModels = selectedModels.filter(model => models.image!.includes(model));
      if (validImageModels.length === 0) setSelectedModels([...models.image]);
      return;
    }

    const defaultModels: Record<string, string> = {
      video: 'Gemini Video 2.0',
      build: 'GPT-5',
      research: 'Sonar Deep Research'
    };
    const availableModelsForMode = models[selectedMode] || [];
    const validModels = selectedModels.filter(model => availableModelsForMode.includes(model));
    if (validModels.length === 0) {
      setSelectedModels([defaultModels[selectedMode] || 'GPT-5']);
    } else if (validModels.length !== selectedModels.length) {
      setSelectedModels(validModels);
    }
  }, [selectedMode, models, selectedModels, setSelectedModels]);

  // Smooth scroll to new messages
  useEffect(() => {
    smoothScrollTo(messagesEndRef.current);
  }, [messages, isLoading]);

  const handleContentChange = useCallback((hasContent: boolean) => {
    setHasInputContent(hasContent);
  }, []);

  const handleSendMessage = useCallback((valueOverride?: string) => {
    const value = valueOverride ?? inputRef.current?.getValue() ?? '';
    if (!value.trim()) return;
    triggerHapticFeedback('light');
    sendMessage(value, attachedFiles);
    inputRef.current?.clear();
    setHasInputContent(false);
    setAttachedFiles([]);
  }, [attachedFiles, sendMessage]);

  const handleTrySend = useCallback((valueOverride?: string) => {
    const value = valueOverride ?? inputRef.current?.getValue() ?? '';
    if (!value.trim() || isCurrentConversationLoading || selectedModels.length === 0) return;
    if (selectedMode === 'research') {
      setShowDeepResearchConfirm(true);
    } else {
      handleSendMessage(value);
    }
  }, [isCurrentConversationLoading, selectedModels.length, selectedMode, handleSendMessage]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleTrySend();
  }, [handleTrySend]);

  const handleConfirmDeepResearch = useCallback(() => {
    setShowDeepResearchConfirm(false);
    handleSendMessage();
  }, [handleSendMessage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
      toast.success(`${files.length} file(s) attached`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleRemoveFile = (index: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  const triggerFileInput = () => fileInputRef.current?.click();

  const getPlaceholder = () => {
    const basePlaceholder = (() => {
      switch (selectedMode) {
        case 'image': return 'Describe the image you want to generate...';
        case 'video': return 'Describe the video you want to create...';
        case 'build': return 'Describe what you want to build...';
        case 'research': return 'What would you like me to research in depth?';
        default: return 'Ask anything...';
      }
    })();
    return isTemporaryMode ? `${basePlaceholder} (Temporary Mode)` : basePlaceholder;
  };

  // Model toggle handlers
  const handleToggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      if (selectedModels.length > 1) setSelectedModels(selectedModels.filter(m => m !== model));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };
  const handleSelectAllModels = () => {
    if (selectedMode === 'text' && models?.text) setSelectedModels([...models.text]);
    else if (selectedMode === 'image' && models?.image) setSelectedModels([...models.image]);
  };
  const handleClearAllModels = () => {
    if (selectedMode === 'text' && models?.text && models.text.length > 0) setSelectedModels([models.text[0]]);
    else if (selectedMode === 'image' && models?.image && models.image.length > 0) setSelectedModels([models.image[0]]);
  };

  return <div className="flex flex-col h-full relative bg-background overflow-hidden">
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-primary bg-primary/5 animate-pulse">
            <ImageIcon className="w-12 h-12 text-primary" />
            <p className="text-lg font-medium text-primary">Drop images here</p>
            <p className="text-sm text-muted-foreground">Supports JPG, PNG, GIF, WebP</p>
          </div>
        </div>
      )}

      {/* Model Rail - Fixed at top (text and image modes) */}
      {selectedMode === 'text' && models?.text && <ModelRail models={models.text} selectedModels={selectedModels} onToggle={handleToggleModel} onSelectAll={handleSelectAllModels} onClearAll={handleClearAllModels} sidebarWidth={isMobile ? 0 : isSidebarExpanded ? 256 : 60} />}
      {selectedMode === 'image' && models?.image && <ModelRail models={models.image} selectedModels={selectedModels} onToggle={handleToggleModel} onSelectAll={handleSelectAllModels} onClearAll={handleClearAllModels} sidebarWidth={isMobile ? 0 : isSidebarExpanded ? 256 : 60} />}

      {/* Mobile Menu Button */}
      {isMobile && <button onClick={() => setOpenMobile(true)} className="fixed top-0 left-0 z-50 w-10 h-10 flex items-center justify-center rounded-full md:hidden my-2.5 ml-3" aria-label="Open menu">
          <Menu className="w-5 h-5 text-foreground" />
        </button>}

      {/* Dialogs */}
      <FeedbackDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog} />
      <RenameDialog open={showRenameDialog} onOpenChange={setShowRenameDialog} currentTitle={currentTitle} onRename={handleRenameSubmit} />
      <DeepResearchConfirmDialog open={showDeepResearchConfirm} onOpenChange={setShowDeepResearchConfirm} onConfirm={handleConfirmDeepResearch} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[17px] font-semibold">Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] text-muted-foreground">
              This action cannot be undone. This will permanently delete the conversation and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Temporary Mode Banner */}
      {isTemporaryMode && <div className="px-4 pt-4">
          <Alert className="glass-panel border-primary/20 max-w-4xl mx-auto">
            <AlertDescription className="text-primary text-sm flex items-center gap-2">
              🕶️ <span className="font-medium">Temporary Chat Mode</span> — This conversation is private and won't be saved
            </AlertDescription>
          </Alert>
        </div>}

      {/* Messages Area */}
      {isLoadingConversation ? (
        <div className={`flex-1 overflow-y-auto overflow-x-hidden pb-[240px] py-6 ${selectedMode === 'text' && models?.text || selectedMode === 'image' && models?.image ? 'pt-[max(7rem,calc(var(--model-rail-offset,0px)+12px))] scroll-pt-[max(7rem,calc(var(--model-rail-offset,0px)+12px))]' : ''}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <MessageSkeleton />
          </div>
        </div>
      ) : messages.length > 0 ? (
        <div key={currentConversationId || 'new'} className={`flex-1 overflow-y-auto overflow-x-hidden pb-[240px] py-4 sm:py-6 animate-content-fade-in ${selectedMode === 'text' && models?.text || selectedMode === 'image' && models?.image ? 'pt-[max(7rem,calc(var(--model-rail-offset,0px)+12px))] scroll-pt-[max(7rem,calc(var(--model-rail-offset,0px)+12px))]' : ''}`}>
          <div className="space-y-4">
            <MessageList
              messages={messages}
              onRetry={retryMessage}
              onRegenerate={regenerateResponse}
              onEdit={editAndRegenerate}
            />
            
            {/* Loading indicators based on mode */}
            {isCurrentConversationLoading && selectedMode === 'research' && <DeepResearchInlineLoader status={researchStatus} elapsedTime={researchElapsedTime} />}
          </div>
          <div ref={messagesEndRef} className="h-[136px]" />
        </div>
      ) : (
        /* Empty State */
        <div className={`flex-1 flex items-center justify-center px-4 pb-[200px] sm:pb-[240px] ${selectedMode === 'text' && models?.text || selectedMode === 'image' && models?.image ? 'pt-16' : ''}`}>
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-primary mb-2 sm:mb-3 animate-logo-entrance animate-float-gentle hover:scale-[1.02] transition-transform duration-300 cursor-default">
              Zebvo AI
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6 animate-tagline-entrance">
              Get Answers from the World's Top AI Models in One Chat
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-6 sm:mb-8">
              <div className="w-2 h-2 rounded-full bg-primary animate-dot-pulse-wave" />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-dot-pulse-wave" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-dot-pulse-wave" style={{ animationDelay: '0.4s' }} />
            </div>
            {/* Keyboard shortcuts hint - hidden on mobile */}
            <div className="hidden sm:flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
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

      {/* Chat Input Area - Fixed at bottom */}
      <div className="fixed bottom-0 right-0 z-30 bg-background border-t border-border/20 transition-[left] duration-300 animate-slide-up-fade" style={{
        left: isMobile ? 0 : isSidebarExpanded ? 280 : 60
      }}>
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
          <form onSubmit={handleSubmit}>
            {/* Mode Dropdown */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <ModeDropdown />
                {selectedMode === 'image' && (
                  <AspectRatioSelector selected={selectedAspectRatio} onChange={setSelectedAspectRatio} />
                )}
              </div>

              <TooltipProvider delayDuration={400}>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setShowFeedbackDialog(true)} className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-accent/80" aria-label="Feedback">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top"><p>Feedback</p></TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-accent/80" aria-label="Conversation options">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top"><p>Options</p></TooltipContent>
                    </Tooltip>

                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleRename} className="gap-2">
                        <Pencil className="h-4 w-4 text-muted-foreground" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShare} className="gap-2">
                        <Share className="h-4 w-4 text-muted-foreground" /> Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowFeedbackDialog(true)} className="gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" /> Feedback
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TooltipProvider>
            </div>

            {/* File Attachments Preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 p-3 bg-card rounded-[18px] border border-border/50">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 text-sm">
                      <span className="text-foreground truncate max-w-[200px]">{file.name}</span>
                      <span className="text-muted-foreground text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
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
            <div className="flex items-end w-full min-h-[52px] sm:min-h-[60px] bg-card rounded-[24px] sm:rounded-[30px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus-within:bg-card/95 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] px-[8px] sm:px-[11px] py-[7px] sm:py-[9px]">
              {/* Left Plus Button */}
              <button type="button" onClick={triggerFileInput} className="flex-shrink-0 w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 hover:scale-[1.05] active:scale-[0.95] transition-all duration-[180ms] border border-border/50">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="sm:w-[18px] sm:h-[18px]">
                  <path d="M10 4V16M4 10H16" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {/* Auto-expanding Textarea */}
              <div className="flex-1 min-w-0 flex items-center px-2 sm:px-4">
                <ChatInput
                  ref={inputRef}
                  onSubmit={handleTrySend}
                  onContentChange={handleContentChange}
                  placeholder={isCurrentConversationLoading && currentGeneratingModel 
                    ? `Generating with ${formatModelName(currentGeneratingModel)}...` 
                    : "Ask Zebvo ai"}
                  disabled={isCurrentConversationLoading}
                />
              </div>

              {/* Right Send Button */}
              <button type={isCurrentConversationLoading ? "button" : "submit"} onClick={isCurrentConversationLoading ? cancelGeneration : undefined} disabled={!isCurrentConversationLoading && (!hasInputContent || selectedModels.length === 0)} className={`flex-shrink-0 w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isCurrentConversationLoading ? 'bg-primary text-primary-foreground hover:bg-primary/80 shadow-lg shadow-primary/25' : !hasInputContent || selectedModels.length === 0 ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border/50' : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 hover:shadow-lg hover:shadow-primary/25 animate-scale-in'}`}>
                {isCurrentConversationLoading ? <Square className="w-4 h-4 fill-current animate-pulse" /> : <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="sm:w-[18px] sm:h-[18px] transition-all duration-300">
                    <path d="M3 10L17 10M17 10L11 4M17 10L11 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>;
}
