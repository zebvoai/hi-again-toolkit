import { useState } from 'react';
import { ChevronLeft, ChevronRight, Grid3x3, ArrowLeft, Copy, CheckCircle2 } from 'lucide-react';
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
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (text: string, modelName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedModel(modelName);
    setTimeout(() => setCopiedModel(null), 2000);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200">
          <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('carousel')}
              className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 rounded-full px-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Carousel
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg">
              Z
            </div>
          </div>
        </div>

        {/* Question Display Section */}
        <div className="max-w-[1400px] mx-auto px-6 pt-16 pb-12">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex items-center px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <span className="text-blue-600 font-medium text-sm">What is blackhole?</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-slate-900">Model Responses</h1>
              <p className="text-lg text-slate-600">Compare answers from different AI models</p>
            </div>
          </div>
        </div>

        {/* Model Response Cards */}
        <div className="max-w-[1400px] mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {models.map((model) => (
              <div
                key={model}
                className="group bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{formatModelName(model)}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all duration-200"
                    onClick={() => handleCopy(content[model], model)}
                  >
                    {copiedModel === model ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in-50 duration-200" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>

                {/* Response Text */}
                <div className="prose prose-slate max-w-none">
                  <div className="text-[16px] leading-[1.7] text-slate-700 space-y-6">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-6 last:mb-0">{children}</p>,
                        code({ inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-2xl !my-6"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm" {...props}>
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
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Carousel view
  const currentModel = models[currentIndex];
  const currentContent = content[currentModel];

  return (
    <div className="space-y-3">
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
            onClick={() => handleCopy(currentContent, currentModel)}
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
