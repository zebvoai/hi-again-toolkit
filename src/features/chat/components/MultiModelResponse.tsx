import { useState } from 'react';
import { ChevronLeft, ChevronRight, Grid3x3, ArrowLeft, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { MultiModelContent } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface MultiModelResponseProps {
  content: MultiModelContent;
  models: string[];
}

export const MultiModelResponse = ({ content, models }: MultiModelResponseProps) => {
  const [viewMode, setViewMode] = useState<'carousel' | 'compare'>('carousel');
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

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
      <div className="space-y-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {models.map((model) => (
            <div key={model} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-blue-600 font-medium text-sm">{model}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCopy(content[model])}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-sm text-gray-700 prose prose-sm max-w-none">
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

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-blue-600 font-medium">[{currentModel}]</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrev}
              disabled={models.length <= 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {models.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNext}
              disabled={models.length <= 1}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700">
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

        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(currentContent)}
            className="text-sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
};
