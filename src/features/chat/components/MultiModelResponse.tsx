import { useState } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { MultiModelContent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatModelName } from '@/lib/utils';

interface MultiModelResponseProps {
  content: MultiModelContent;
  models: string[];
  userQuestion: string;
}

export const MultiModelResponse = ({ content, models, userQuestion }: MultiModelResponseProps) => {
  const [viewMode, setViewMode] = useState<'single' | 'sideBySide'>('sideBySide');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const { toast } = useToast();

  const getProviderIcon = (model: string) => {
    const modelLower = model.toLowerCase();
    
    if (modelLower.includes('gpt') || modelLower.includes('openai')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="#10A37F"/>
          <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    if (modelLower.includes('gemini') || modelLower.includes('google')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" fill="#4285F4"/>
          <path d="M12 8L15 12L12 16L9 12L12 8Z" fill="white"/>
        </svg>
      );
    }
    
    if (modelLower.includes('claude') || modelLower.includes('anthropic')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <rect width="24" height="24" rx="6" fill="#D97757"/>
          <path d="M8 16L12 8L16 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" fill="#6B7280"/>
        <path d="M12 8V12L15 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const handleCopy = (model: string) => {
    const text = content[model] || '';
    navigator.clipboard.writeText(text);
    setCopiedModel(model);
    toast({
      description: 'Response copied to clipboard',
      duration: 2000,
    });
    setTimeout(() => setCopiedModel(null), 2000);
  };

  // Single view (carousel) - shows one model at a time
  if (viewMode === 'single') {
    const currentModel = models[currentIndex];
    const currentContent = content[currentModel] || 'Generating response...';

    return (
      <div className="w-full space-y-4 py-4">
        {/* User Question */}
        <div className="flex justify-end px-4">
          <div className="max-w-[75%] rounded-[18px_18px_4px_18px] bg-gradient-to-br from-primary to-primary/85 text-primary-foreground px-4 py-3 shadow-sm">
            <p className="text-[15px] leading-[1.5] whitespace-pre-wrap break-words">
              {userQuestion}
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="flex justify-end px-4">
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
        <div className="max-w-[75%] px-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shadow-sm flex-shrink-0">
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
                    >
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => setCurrentIndex((prev) => (prev + 1) % models.length)}
                      className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center panel-button"
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

              <div className="flex items-center gap-2 mt-2 ml-1">
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

  // Side by Side view - all models in horizontal columns for THIS response only
  return (
    <div className="w-full overflow-hidden py-4">
      {/* User Question - Centered above all columns */}
      <div className="flex justify-center mb-4 px-4">
        <div className="max-w-[600px] rounded-[18px] bg-gradient-to-br from-primary to-primary/85 text-primary-foreground px-5 py-3 shadow-sm">
          <p className="text-[15px] leading-[1.5] whitespace-pre-wrap break-words text-center">
            {userQuestion}
          </p>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="flex justify-end mb-4 px-4">
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

      {/* Model Response Columns */}
      <div className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-4">
          {models.map((model) => {
            const response = content[model] || 'Generating response...';
            
            return (
              <div
                key={model}
                className="flex-1 min-w-[280px] max-w-[380px] flex flex-col bg-card/80 dark:bg-card/40 rounded-2xl border border-border/50 shadow-sm overflow-hidden"
              >
                {/* Model Header */}
                <div className="flex-shrink-0 h-12 px-4 border-b border-border/40 bg-card/60 dark:bg-card/30 backdrop-blur-sm flex items-center gap-2.5">
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    {getProviderIcon(model)}
                  </div>
                  <span className="text-sm font-semibold text-foreground truncate">
                    {formatModelName(model)}
                  </span>
                </div>

                {/* Response Content */}
                <div className="flex-1 p-4">
                  <div className="bg-muted/30 dark:bg-muted/20 rounded-xl border border-border/30 overflow-hidden">
                    <div className="px-4 py-3 text-[14px] leading-[1.6] text-foreground">
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
                        }}
                      >
                        {response}
                      </ReactMarkdown>
                    </div>

                    {/* Copy Button */}
                    <div className="flex items-center gap-1 h-9 px-3 border-t border-border/30 bg-muted/10">
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
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MultiModelResponse;