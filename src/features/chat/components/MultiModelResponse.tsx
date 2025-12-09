import { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, Download, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { MultiModelContent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatModelName } from '@/lib/utils';
import { ViewModeToggle } from './ViewModeToggle';
interface MultiModelResponseProps {
  content: MultiModelContent;
  models: string[];
}

export const MultiModelResponse = ({ content, models }: MultiModelResponseProps) => {
  const [viewMode, setViewMode] = useState<'single' | 'sideBySide'>('sideBySide');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const { toast } = useToast();

  // Helper to get display name - always show "Zebvo AI" for Zebvo-routed models
  const getDisplayName = (model: string) => {
    if (model === 'Zebvo AI' || model.startsWith('Zebvo AI')) {
      return 'Zebvo AI';
    }
    return formatModelName(model);
  };

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
    a.download = `${getDisplayName(model)}-response.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      description: 'Response downloaded',
      duration: 2000,
    });
  };

  const currentModel = models[currentIndex];
  const currentContent = content[currentModel] || '';

  // Single view (carousel)
  if (viewMode === 'single') {
    return (
      <div className="w-full space-y-3">
        <ViewModeToggle 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          modelInfo={`${currentIndex + 1} of ${models.length} model${models.length > 1 ? 's' : ''}`}
        />

        {/* Single Model Response */}
        <div className="max-w-[75%]">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shadow-[0_4px_12px_rgba(77,112,255,0.15)] flex-shrink-0">
              <span className="text-primary font-semibold text-sm">Z</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {getDisplayName(currentModel)} • {currentIndex + 1}/{models.length}
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
                          <div className="my-3 rounded-lg overflow-hidden">
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
                          <code className="bg-muted/50 dark:bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1.5">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-2 first:mt-0">{children}</h3>,
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

  // Side by Side view - unified response container
  return (
    <div className="w-full overflow-visible animate-message-in-left">
      {/* Unified Response Header - Toggle RIGHT + Model Count */}
      <div className="mb-3">
        <ViewModeToggle 
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          modelInfo={`${models.length} model${models.length > 1 ? 's' : ''} responding`}
        />
      </div>

      {/* Horizontal Scroll Container - with scroll indicators */}
      <div className="relative">
        {/* Left gradient fade */}
        <div className="absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
        {/* Right gradient fade */}
        <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
        
        <div className="overflow-x-auto scrollbar-hide pb-3 scroll-smooth snap-x snap-mandatory">
          <div className="flex gap-3 px-6" style={{ minWidth: 'min-content' }}>
            {models.map((model) => {
              const aiResponse = content[model] || '';
              const isGenerating = !aiResponse || aiResponse.trim() === '';
              const contentLength = aiResponse.length;
              
              return (
                <div
                  key={model}
                  className="min-w-[280px] max-w-[380px] flex-1 flex-shrink-0 flex flex-col bg-card rounded-xl border border-border/30 shadow-sm overflow-hidden snap-start hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Compact Model Header */}
                  <div className="flex-shrink-0 h-9 px-3 border-b border-border/20 bg-muted/10">
                    <div className="flex items-center h-full gap-2">
                      <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                        {getProviderIcon(model)}
                      </div>
                      <span className="text-[12px] font-medium text-foreground/80 truncate">
                        {getDisplayName(model)}
                      </span>
                    </div>
                  </div>

                  {/* AI Response Content - adaptive height */}
                  <div className={`flex-1 overflow-y-auto p-3 ${
                    contentLength < 100 ? 'min-h-[50px]' : 'min-h-[70px]'
                  } max-h-[280px]`}>
                    <div className="text-[13px] leading-[1.55] text-foreground">
                      {isGenerating ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-1.5">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]"></span>
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]"></span>
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]"></span>
                          </div>
                          <span className="text-[11px]">Generating...</span>
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
                                <code className="bg-muted/50 dark:bg-muted px-1 py-0.5 rounded text-[12px] font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 mt-2 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1.5 mt-2 first:mt-0">{children}</h3>,
                          }}
                        >
                          {aiResponse}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>

                  {/* Compact Action Buttons */}
                  <div className="flex items-center gap-0.5 h-8 px-2 border-t border-border/15 bg-muted/5 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(model)}
                      className="w-6 h-6 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-center"
                      title="Copy"
                    >
                      {copiedModel === model ? (
                        <Check className="w-3 h-3 text-primary" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      className="w-6 h-6 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-center"
                      title="Like"
                    >
                      <ThumbsUp className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button
                      className="w-6 h-6 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-center"
                      title="Dislike"
                    >
                      <ThumbsDown className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDownload(model)}
                      className="w-6 h-6 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-center ml-auto"
                      title="Download"
                    >
                      <Download className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
