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

  // Side by Side view - each response is an independent horizontal scroll
  return (
    <div className="w-full overflow-visible animate-message-in-left">
      {/* Toggle Button */}
      <div className="flex justify-end mb-4 px-6">
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

      {/* User Question - Centered above the model responses */}
      {userQuestion && (
        <div className="flex justify-end px-6 mb-4">
          <div className="max-w-[50%] rounded-[18px_18px_4px_18px] bg-gradient-to-br from-primary to-primary/85 text-primary-foreground px-4 py-3 shadow-[0_2px_8px_rgba(77,112,255,0.2)]">
            <p className="text-[15px] leading-[1.5] whitespace-pre-wrap break-words">
              {userQuestion}
            </p>
          </div>
        </div>
      )}

      {/* Horizontal Scroll Container for Model Responses - Edge to Edge */}
      <div className="overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-3 px-6" style={{ minWidth: 'min-content' }}>
          {models.map((model) => {
            const aiResponse = content[model] || '';
            const isGenerating = !aiResponse || aiResponse.trim() === '';
            
            return (
              <div
                key={model}
                className="min-w-[280px] max-w-[400px] flex-1 flex-shrink-0 flex flex-col bg-card/80 dark:bg-card/40 rounded-2xl border border-border/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden"
              >
                {/* Model Header */}
                <div className="flex-shrink-0 h-12 px-4 border-b border-border/40 bg-card/60 dark:bg-card/30 backdrop-blur-sm">
                  <div className="flex items-center justify-between h-full">
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

                {/* AI Response Content - min height for short, max for long */}
                <div className="flex-1 overflow-y-auto p-4 min-h-[100px] max-h-[400px]">
                  <div className="text-[14px] leading-[1.6] text-foreground">
                    {isGenerating ? (
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
                        {aiResponse}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 h-10 px-3 border-t border-border/30 bg-muted/10 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(model)}
                    className="w-7 h-7 rounded-md hover:bg-muted/50 transition-colors flex items-center justify-center"
                    title="Copy response"
                  >
                    {copiedModel === model ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
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
                    onClick={() => handleDownload(model)}
                    className="flex items-center gap-1.5 h-7 px-2.5 rounded-md hover:bg-muted/50 transition-colors text-[12px] text-muted-foreground ml-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
