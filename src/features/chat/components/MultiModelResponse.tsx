import { useState } from 'react';
import { ChevronDown, Copy, ThumbsUp, ThumbsDown, Download, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { MultiModelContent, Message } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatModelName } from '@/lib/utils';

interface MultiModelResponseProps {
  content: MultiModelContent;
  models: string[];
  userQuestion: string;
  allMessages?: Message[];
}

export const MultiModelResponse = ({ content, models, userQuestion, allMessages = [] }: MultiModelResponseProps) => {
  const [viewMode, setViewMode] = useState<'single' | 'sideBySide'>('sideBySide');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const { toast } = useToast();

  // Extract all multi-model Q&A pairs grouped by model
  const getModelConversationHistory = () => {
    const modelHistory: Record<string, Array<{ userQuestion: string; aiResponse: string }>> = {};
    
    // Initialize history for each model
    models.forEach(model => {
      modelHistory[model] = [];
    });

    // Iterate through all messages to find multi-model pairs
    for (let i = 0; i < allMessages.length; i++) {
      const message = allMessages[i];
      
      // Check if this is a multi-model assistant response
      if (
        message.role === 'assistant' &&
        typeof message.content === 'object' &&
        !Array.isArray(message.content) &&
        message.metadata?.models?.length > 1
      ) {
        // Find the preceding user message
        const userMessage = i > 0 ? allMessages[i - 1] : null;
        const userQ = userMessage?.role === 'user' && typeof userMessage.content === 'string' 
          ? userMessage.content 
          : '';

        // Add this Q&A pair to each model's history - use all models in the models array
        models.forEach(model => {
          const response = (message.content as MultiModelContent)[model];
          // Include even empty responses with a placeholder message
          modelHistory[model].push({
            userQuestion: userQ,
            aiResponse: response && response.trim() !== '' 
              ? response 
              : 'Generating response...'
          });
        });
      }
    }

    // Also add the current content if it's not already in allMessages
    const lastAssistant = allMessages[allMessages.length - 1];
    const hasCurrentContent = lastAssistant?.role === 'assistant' && 
      typeof lastAssistant.content === 'object' &&
      lastAssistant.metadata?.models?.length > 1;
    
    if (!hasCurrentContent && Object.keys(content).length > 0) {
      models.forEach(model => {
        const response = content[model];
        if (response !== undefined) {
          // Check if we already have this response in history
          const lastEntry = modelHistory[model]?.[modelHistory[model].length - 1];
          if (!lastEntry || lastEntry.aiResponse !== response) {
            modelHistory[model].push({
              userQuestion: userQuestion,
              aiResponse: response && response.trim() !== '' 
                ? response 
                : 'Generating response...'
            });
          }
        }
      });
    }

    return modelHistory;
  };

  const modelHistory = getModelConversationHistory();

  const getProviderIcon = (model: string) => {
    const modelLower = model.toLowerCase();
    
    if (modelLower.includes('gpt') || modelLower.includes('openai')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="#10A37F"/>
          <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    if (modelLower.includes('gemini') || modelLower.includes('google')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <circle cx="12" cy="12" r="10" fill="#4285F4"/>
          <path d="M12 8L15 12L12 16L9 12L12 8Z" fill="white"/>
        </svg>
      );
    }
    
    if (modelLower.includes('claude') || modelLower.includes('anthropic')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <rect width="24" height="24" rx="6" fill="#D97757"/>
          <path d="M8 16L12 8L16 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    // Default icon
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" fill="#6B7280"/>
        <path d="M12 8V12L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const handleCopy = (model: string) => {
    navigator.clipboard.writeText(content[model]);
    setCopiedModel(model);
    toast({
      description: 'Response copied to clipboard',
      duration: 2000,
    });
    setTimeout(() => setCopiedModel(null), 2000);
  };

  const handleDownload = (model: string) => {
    const blob = new Blob([content[model]], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formatModelName(model)}-response.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      description: 'Response downloaded',
      duration: 2000,
    });
  };

  // Single view (carousel)
  if (viewMode === 'single') {
    const currentModel = models[currentIndex];
    const currentContent = content[currentModel];

    return (
      <div className="w-full space-y-3">
        {/* Toggle Button */}
        <div className="flex justify-end">
          <div className="glass-panel flex items-center gap-1 p-1">
            <button 
              onClick={() => setViewMode('single')}
              className="px-4 py-2 rounded-[14px] text-xs font-medium bg-card text-foreground shadow-sm apple-interactive"
            >
              Single
            </button>
            <button 
              onClick={() => setViewMode('sideBySide')}
              className="px-4 py-2 rounded-[14px] text-xs font-medium text-muted-foreground hover:text-foreground panel-button"
            >
              Compare
            </button>
          </div>
        </div>

        {/* Single Model Response */}
        <div className="max-w-[75%]">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shadow-[0_4px_12px_rgba(77,112,255,0.15)] flex-shrink-0">
              <span className="text-primary font-semibold text-sm">Z</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {formatModelName(currentModel)} • {currentIndex + 1}/{models.length}
                </span>
                
                {models.length > 1 && (
                  <div className="flex items-center gap-1 ml-auto">
                    <button 
                      onClick={() => setCurrentIndex((prev) => (prev - 1 + models.length) % models.length)}
                      className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center panel-button"
                      aria-label="Previous model"
                    >
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => setCurrentIndex((prev) => (prev + 1) % models.length)}
                      className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center panel-button"
                      aria-label="Next model"
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="glass-panel px-4 py-3">
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown
                    components={{
                      code({ inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {currentContent}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 ml-1">
                <button
                  onClick={() => handleCopy(currentModel)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground panel-button"
                >
                  {copiedModel === currentModel ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-primary" />
                      <span className="text-primary">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Side by Side view (continuous vertical columns)
  return (
    <div className="w-full overflow-hidden">
      {/* Toggle Button - Fixed top right with consistent spacing */}
      <div className="flex justify-end mt-4 mb-6 px-4">
        <div className="glass-panel flex items-center gap-1 p-1">
          <button 
            onClick={() => setViewMode('single')}
            className="px-4 py-2 rounded-[14px] text-xs font-medium text-muted-foreground hover:text-foreground panel-button"
          >
            Single
          </button>
          <button 
            onClick={() => setViewMode('sideBySide')}
            className="px-4 py-2 rounded-[14px] text-xs font-medium bg-card text-foreground shadow-sm apple-interactive"
          >
            Compare
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Container with Consistent Column Layout */}
      <div className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex h-[calc(100vh-280px)] gap-4">
          {models.map((model) => (
            <div
              key={model}
              className="flex-1 min-w-[300px] max-w-[360px] flex flex-col bg-card/80 dark:bg-card/40 rounded-2xl border border-border/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              {/* Model Header - Fixed height for perfect alignment */}
              <div className="flex-shrink-0 h-14 px-4 border-b border-border/40 bg-card/60 dark:bg-card/30 backdrop-blur-sm">
                <div className="flex items-center justify-between h-full">
                  {/* Left: Icon + Model Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                      {getProviderIcon(model)}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {formatModelName(model)}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                  
                  {/* Right: Add + Toggle - Fixed width for alignment */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      className="w-7 h-7 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-center" 
                      aria-label="Add"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" className="text-muted-foreground" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <div className="w-9 h-5 bg-muted/60 rounded-full relative cursor-pointer hover:bg-muted/80 transition-colors">
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area - Consistent padding */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-5">
                  {modelHistory[model]?.map((qa, qaIndex) => (
                    <div key={qaIndex} className="space-y-3">
                      {/* User Question - Right aligned */}
                      {qa.userQuestion && (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] rounded-[16px_16px_4px_16px] bg-gradient-to-br from-primary to-primary/85 text-primary-foreground px-4 py-2.5 shadow-[0_2px_8px_rgba(77,112,255,0.2)]">
                            <p className="text-[14px] leading-[1.5] whitespace-pre-wrap break-words">
                              {qa.userQuestion}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* AI Response Card - Consistent styling */}
                      <div className="bg-muted/30 dark:bg-muted/20 rounded-[16px_16px_16px_4px] border border-border/30 overflow-hidden">
                        <div className="px-4 py-3 text-[14px] leading-[1.6] text-foreground">
                          {qa.aiResponse === 'Generating response...' ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]"></span>
                                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]"></span>
                                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]"></span>
                              </div>
                              <span className="text-sm">Generating response...</span>
                            </div>
                          ) : (
                            <ReactMarkdown
                              components={{
                                code({ inline, className, children, ...props }: any) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <div className="my-2 rounded-lg overflow-hidden">
                                      <SyntaxHighlighter
                                        style={vscDarkPlus}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    </div>
                                  ) : (
                                    <code className="bg-muted px-1 py-0.5 rounded text-[13px] font-mono" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1.5">{children}</h3>,
                              }}
                            >
                              {qa.aiResponse}
                            </ReactMarkdown>
                          )}
                        </div>

                        {/* Action Buttons - Consistent spacing and alignment */}
                        <div className="flex items-center gap-1 h-10 px-3 border-t border-border/30 bg-muted/10">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(qa.aiResponse);
                              toast({ description: 'Response copied', duration: 2000 });
                            }}
                            className="w-7 h-7 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-center"
                            title="Copy response"
                          >
                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            className="w-7 h-7 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-center"
                            title="Good response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            className="w-7 h-7 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-center"
                            title="Bad response"
                          >
                            <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([qa.aiResponse], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${formatModelName(model)}-response-${qaIndex + 1}.txt`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              toast({ description: 'Response downloaded', duration: 2000 });
                            }}
                            className="flex items-center gap-1.5 h-7 px-2.5 rounded-md hover:bg-muted/50 transition-colors text-[12px] text-muted-foreground ml-auto"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
