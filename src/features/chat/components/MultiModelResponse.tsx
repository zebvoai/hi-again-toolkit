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
          <div className="flex items-center justify-between px-6 py-4">
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

        {/* Question Display */}
        <div className="px-6 pt-8 pb-6">
          <div className="flex justify-end">
            <div className="inline-flex items-center px-5 py-2.5 bg-blue-500 rounded-full shadow-sm">
              <span className="text-white font-medium text-sm">What is blackhole?</span>
            </div>
          </div>
        </div>

        {/* Model Response Cards */}
        <div className="px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <div
                key={model}
                className="group bg-white rounded-[20px] border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 ease-out"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{formatModelName(model)}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all duration-200"
                    onClick={() => handleCopy(content[model], model)}
                  >
                    {copiedModel === model ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 animate-in zoom-in-50 duration-200" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Response Text */}
                <div className="mb-5">
                  <p className="text-[15px] leading-[1.7] text-slate-700">
                    {content[model]}
                  </p>
                </div>

                {/* Key Points Section - Hardcoded for demo */}
                {model.includes('GPT-5') && !model.includes('Mini') && !model.includes('Nano') && (
                  <div className="pt-5 border-t border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">KEY POINTS</p>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">Formation</p>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        Most form when massive stars collapse at the end of their lives; others grow via mergers and by pulling in surrounding matter. Supermassive black holes sit at the centers of most galaxies.
                      </p>
                    </div>
                  </div>
                )}

                {model.includes('Mini') && (
                  <div className="pt-5 border-t border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">KEY POINTS</p>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">Event horizon</p>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        the invisible surface around a black hole beyond which escape is impossible.
                      </p>
                    </div>
                  </div>
                )}

                {model.includes('Nano') && (
                  <div className="pt-5 border-t border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">KEY POINTS</p>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">Event horizon</p>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        the invisible boundary around a black hole beyond which escape is impossible (not even for light).
                      </p>
                    </div>
                  </div>
                )}

                {model.includes('4.1') && (
                  <div className="pt-5 border-t border-slate-200">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">KEY POINTS</p>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-1">Formation</p>
                      <p className="text-[13px] text-slate-600 leading-relaxed">
                        Black holes are usually formed from the remnants of massive stars that have ended their life cycles and collapsed.
                      </p>
                    </div>
                  </div>
                )}
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
