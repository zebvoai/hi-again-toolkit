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

        // Add this Q&A pair to each model's history
        Object.keys(message.content).forEach(model => {
          if (modelHistory[model]) {
            modelHistory[model].push({
              userQuestion: userQ,
              aiResponse: message.content[model] as string
            });
          }
        });
      }
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
          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
            <button 
              onClick={() => setViewMode('single')}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-white text-gray-900 shadow-sm"
            >
              Single
            </button>
            <button 
              onClick={() => setViewMode('sideBySide')}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors text-gray-500 hover:text-gray-700"
            >
              Compare
            </button>
          </div>
        </div>

        {/* Single Model Response */}
        <div className="max-w-[75%]">
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.08)] flex-shrink-0">
              <span className="text-blue-700 font-semibold text-sm">Z</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-gray-400">
                  {formatModelName(currentModel)} • {currentIndex + 1}/{models.length}
                </span>
                
                {models.length > 1 && (
                  <div className="flex items-center gap-0.5 ml-auto">
                    <button 
                      onClick={() => setCurrentIndex((prev) => (prev - 1 + models.length) % models.length)}
                      className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                      aria-label="Previous model"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => setCurrentIndex((prev) => (prev + 1) % models.length)}
                      className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                      aria-label="Next model"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="rounded-[18px_18px_18px_4px] bg-[#F0F0F0] text-[#1A1A1A] px-4 py-3 shadow-sm">
                <div className="prose prose-sm max-w-none [&>*]:text-[#1A1A1A]">
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
                          <code className="bg-gray-200/60 px-1.5 py-0.5 rounded text-sm" {...props}>
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

              <div className="flex items-center gap-2 mt-2 ml-0.5">
                <button
                  onClick={() => handleCopy(currentModel)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  {copiedModel === currentModel ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
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

  // Side by Side view (continuous vertical columns like AI Fiesta)
  return (
    <div className="w-full overflow-hidden">
      {/* Toggle Button */}
      <div className="flex justify-end mb-2 px-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
          <button 
            onClick={() => setViewMode('single')}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors text-gray-500 hover:text-gray-700"
          >
            Single
          </button>
          <button 
            onClick={() => setViewMode('sideBySide')}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-white text-gray-900 shadow-sm"
          >
            Compare
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Container with Persistent Vertical Columns */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max h-[calc(100vh-280px)]">
          {models.map((model, index) => (
            <div
              key={model}
              className={`flex-shrink-0 w-[380px] flex flex-col ${index !== models.length - 1 ? 'border-r border-gray-200' : ''}`}
            >
              {/* Sticky Model Header */}
              <div className="sticky top-0 z-10 px-4 py-3 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(model)}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatModelName(model)}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <div className="w-9 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area - Shows ALL conversation history for this model */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-white">
                {modelHistory[model]?.map((qa, qaIndex) => (
                  <div key={qaIndex} className="mb-8 last:mb-4">
                    {/* User Question */}
                    {qa.userQuestion && (
                      <div className="flex justify-end mb-4">
                        <div className="max-w-[85%] rounded-[18px_18px_4px_18px] bg-gradient-to-br from-[#5B9FFF] to-[#4A8FFF] text-white px-4 py-3 shadow-sm">
                          <p className="text-[15px] leading-[1.5] whitespace-pre-wrap break-words">
                            {qa.userQuestion}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI Response */}
                    <div className="text-[15px] leading-[1.6] text-[#1A1A1A] rounded-[18px_18px_18px_4px] bg-[#F0F0F0] px-4 py-3">
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
                              <code className="bg-gray-200/60 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                {children}
                              </code>
                            );
                          },
                          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
                        }}
                      >
                        {qa.aiResponse}
                      </ReactMarkdown>

                      {/* Action Buttons for each response */}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200/60">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(qa.aiResponse);
                            toast({ description: 'Response copied', duration: 2000 });
                          }}
                          className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                          title="Copy response"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                          title="Good response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                          title="Bad response"
                        >
                          <ThumbsDown className="w-3.5 h-3.5 text-gray-600" />
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
                          className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/60 rounded-lg transition-colors text-xs text-gray-700 ml-auto"
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
          ))}
        </div>
      </div>
    </div>
  );
};
