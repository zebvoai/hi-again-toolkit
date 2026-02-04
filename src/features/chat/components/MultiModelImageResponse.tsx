import { useRef, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MultiModelContent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatModelName } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MultiModelImageResponseProps {
  content: MultiModelContent;
  models: string[];
}

// Model provider colors (matching ModelRail)
const getModelStyle = (model: string): { bg: string; border: string } => {
  const lowerModel = model.toLowerCase();
  
  if (lowerModel.includes('vidu')) {
    return { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30' };
  }
  if (lowerModel.includes('wan')) {
    return { bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
  }
  if (lowerModel.includes('nano') || lowerModel.includes('banana')) {
    return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
  }
  if (lowerModel.includes('gpt') || lowerModel.includes('openai')) {
    return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  }
  if (lowerModel.includes('minimax')) {
    return { bg: 'bg-pink-500/10', border: 'border-pink-500/30' };
  }
  if (lowerModel.includes('qwen')) {
    return { bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
  }
  if (lowerModel.includes('grok') || lowerModel.includes('imagine')) {
    return { bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
  }
  
  return { bg: 'bg-muted', border: 'border-border' };
};

export const MultiModelImageResponse = ({ content, models }: MultiModelImageResponseProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Smooth horizontal scroll with mouse wheel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleDownload = async (url: string, modelName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${modelName.replace(/\s+/g, '-')}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast({
        description: 'Image downloaded successfully',
        duration: 2000,
      });
    } catch (error) {
      toast({
        description: 'Failed to download image',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  return (
    <div className="w-full">
      {/* Horizontal scroll container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {models.map((model) => {
          const imageUrl = content[model];
          const isError = typeof imageUrl === 'string' && imageUrl.startsWith('Error:');
          const isLoading = !imageUrl || imageUrl === '';
          const style = getModelStyle(model);
          
          return (
            <div 
              key={model} 
              className={cn(
                "flex-shrink-0 w-[320px] md:w-[380px] rounded-xl border-2 overflow-hidden",
                style.bg,
                style.border
              )}
            >
              {/* Model header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
                <span className="text-sm font-medium text-foreground truncate">
                  {formatModelName(model)}
                </span>
                {!isError && !isLoading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-background/50"
                    onClick={() => handleDownload(imageUrl, model)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Image content */}
              <div className="p-2">
                {isLoading ? (
                  <div className="aspect-square bg-background/50 rounded-lg flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs">Generating...</span>
                    </div>
                  </div>
                ) : isError ? (
                  <div className="aspect-square bg-red-50 border border-red-200 rounded-lg flex items-center justify-center p-4">
                    <p className="text-sm text-red-700 text-center">{imageUrl}</p>
                  </div>
                ) : (
                  <img 
                    src={imageUrl} 
                    alt={`Generated by ${model}`}
                    className="w-full rounded-lg shadow-md"
                    onError={(e) => {
                      console.error(`Failed to load image from ${model}:`, imageUrl);
                      const target = e.target as HTMLImageElement;
                      target.alt = `Failed to load image from ${model}`;
                    }}
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
