import { useState } from 'react';
import { ChevronLeft, ChevronRight, Grid3x3, ArrowLeft, Copy, Bot, Sparkles, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { MultiModelContent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatModelName } from '@/lib/utils';

interface MultiModelResponseProps {
  content: MultiModelContent;
  models: string[];
}

export const MultiModelResponse = ({ content, models }: MultiModelResponseProps) => {
  const [viewMode, setViewMode] = useState<'carousel' | 'compare'>('carousel');
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const getProviderIcon = (model: string) => {
    const modelLower = model.toLowerCase();
    if (modelLower.includes('gpt') || modelLower.includes('openai')) return <Bot className="w-4 h-4" />;
    if (modelLower.includes('gemini') || modelLower.includes('google')) return <Sparkles className="w-4 h-4" />;
    if (modelLower.includes('claude') || modelLower.includes('anthropic')) return <Brain className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  const ModelScrollBar = () => (
    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2">
      <div className="flex gap-3 min-w-max">
        {models.map((model) => (
          <div
            key={model}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-[12px] border border-gray-200 shadow-sm hover:shadow-md transition-shadow min-w-[180px]"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
              {getProviderIcon(model)}
            </div>
            <span className="text-sm font-medium text-gray-700 flex-1">
              {formatModelName(model)}
            </span>
            <button className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border-2 border-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: 'Copied to clipboard',
      duration: 2000,
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % models.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + models.length) % models.length);
  };

  if (viewMode === 'compare') {
    return (
      <div className="space-y-4 ml-auto max-w-[75%]">
        <ModelScrollBar />
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('carousel')}
            className="text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Carousel
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {models.map((model) => (
            <div key={model} className="bg-white/80 backdrop-blur-sm rounded-lg border border-border/30 p-3 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{formatModelName(model)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-muted/50"
                  onClick={() => handleCopy(content[model])}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="text-sm text-foreground prose prose-sm max-w-none leading-[1.6]">
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
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content[model]}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Carousel view
  const currentModel = models[currentIndex];
  const currentContent = content[currentModel];

  return (
    <div className="space-y-3 ml-auto max-w-[75%]">
      <ModelScrollBar />
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode('compare')}
          className="text-sm"
        >
          <Grid3x3 className="w-4 h-4 mr-2" />
          Compare
        </Button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-border/30 p-3 space-y-2 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {formatModelName(currentModel)}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted/50"
              onClick={handlePrev}
              disabled={models.length <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
              {currentIndex + 1} of {models.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted/50"
              onClick={handleNext}
              disabled={models.length <= 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-foreground leading-[1.6]">
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
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {currentContent}
          </ReactMarkdown>
        </div>

        <div className="flex items-center justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(currentContent)}
            className="h-6 px-2 text-xs hover:bg-muted/50 text-muted-foreground hover:text-foreground -ml-1"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
};
