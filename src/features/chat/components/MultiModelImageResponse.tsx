import { useRef, useEffect, useState } from 'react';
import { Download, AlertCircle, Copy, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageLightbox } from '@/components/ImageLightbox';
import type { MultiModelContent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatModelName } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { copyImageToClipboard } from '@/hooks/useImagePaste';
interface MultiModelImageResponseProps {
  content: MultiModelContent;
  models: string[];
  aspectRatio?: string;
  prompt?: string;
  onEditPrompt?: (prompt: string) => void;
}

// Aspect ratio to CSS class mapping
const getAspectRatioClass = (ratio?: string): string => {
  switch (ratio) {
    case '16:9':
      return 'aspect-video';
    case '9:16':
      return 'aspect-[9/16]';
    case '3:2':
      return 'aspect-[3/2]';
    case '2:3':
      return 'aspect-[2/3]';
    case '1:1':
    default:
      return 'aspect-square';
  }
};

// Model provider colors (matching ModelRail)
const getModelStyle = (model: string): {
  bg: string;
  border: string;
} => {
  const lowerModel = model.toLowerCase();
  if (lowerModel.includes('vidu')) {
    return {
      bg: 'bg-fuchsia-500/10',
      border: 'border-fuchsia-500/30'
    };
  }
  if (lowerModel.includes('wan')) {
    return {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30'
    };
  }
  if (lowerModel.includes('nano') || lowerModel.includes('banana')) {
    return {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30'
    };
  }
  if (lowerModel.includes('gpt') || lowerModel.includes('openai')) {
    return {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30'
    };
  }
  if (lowerModel.includes('minimax')) {
    return {
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/30'
    };
  }
  if (lowerModel.includes('qwen')) {
    return {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30'
    };
  }
  if (lowerModel.includes('grok') || lowerModel.includes('imagine')) {
    return {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30'
    };
  }
  return {
    bg: 'bg-muted',
    border: 'border-border'
  };
};
export const MultiModelImageResponse = ({
  content,
  models,
  aspectRatio,
  prompt,
  onEditPrompt
}: MultiModelImageResponseProps) => {
  const aspectClass = getAspectRatioClass(aspectRatio);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);
  const {
    toast
  } = useToast();
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    model: string;
  } | null>(null);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [timedOutModels, setTimedOutModels] = useState<Set<string>>(new Set());
  const loadingStartTimeRef = useRef<Record<string, number>>({});

  // Track loading start time for each model and set 60-second timeout
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    models.forEach(model => {
      const imageUrl = content[model];
      const isLoading = !imageUrl || imageUrl === '';
      
      if (isLoading) {
        // Start tracking if not already tracked
        if (!loadingStartTimeRef.current[model]) {
          loadingStartTimeRef.current[model] = Date.now();
          
          // Set timeout for 60 seconds
          const timeout = setTimeout(() => {
            setTimedOutModels(prev => new Set([...prev, model]));
          }, 60000);
          timeouts.push(timeout);
        }
      } else {
        // Clear tracking if loaded
        delete loadingStartTimeRef.current[model];
        setTimedOutModels(prev => {
          const next = new Set(prev);
          next.delete(model);
          return next;
        });
      }
    });
    
    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [models, content]);

  // Only apply entrance animation on first mount
  const shouldAnimate = !hasAnimatedRef.current;
  if (shouldAnimate) {
    hasAnimatedRef.current = true;
  }
  const handleCopyPrompt = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      toast({
        description: 'Prompt copied to clipboard',
        duration: 2000
      });
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };
  const handleEditPrompt = () => {
    if (prompt && onEditPrompt) {
      onEditPrompt(prompt);
    }
  };

  // Smooth horizontal scroll with mouse wheel - only when multiple models need horizontal scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || models.length <= 1) return;
    const handleWheel = (e: WheelEvent) => {
      // Only hijack vertical scroll if content actually overflows horizontally
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handleWheel, {
      passive: false
    });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [models.length]);
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
        duration: 2000
      });
    } catch (error) {
      toast({
        description: 'Failed to download image',
        variant: 'destructive',
        duration: 2000
      });
    }
  };
  const handleCopyToClipboard = async (url: string, model: string) => {
    setCopiedModel(model);
    const success = await copyImageToClipboard(url);
    if (success) {
      toast({
        description: 'Image copied to clipboard',
        duration: 2000
      });
    } else {
      toast({
        description: 'Failed to copy image',
        variant: 'destructive',
        duration: 2000
      });
    }
    setTimeout(() => setCopiedModel(null), 2000);
  };
  return <div className={`w-full ${shouldAnimate ? 'appear-smooth' : ''}`}>
      {/* Fullscreen Lightbox */}
      {lightboxImage && <ImageLightbox src={lightboxImage.url} alt={`Generated by ${lightboxImage.model}`} modelName={formatModelName(lightboxImage.model)} onClose={() => setLightboxImage(null)} />}
      
      
      {/* Horizontal scroll container - full width, hidden scrollbar */}
      <div ref={scrollRef} className={`flex gap-4 overflow-x-auto scrollbar-hide ${shouldAnimate ? 'stagger-cards' : ''}`} style={{
      scrollBehavior: 'smooth',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {models.map(model => {
        const imageUrl = content[model];
        const isError = typeof imageUrl === 'string' && imageUrl.startsWith('Error:');
        const isContentFlagged = typeof imageUrl === 'string' && 
          (imageUrl.includes('IMAGE_CONTENT_FLAGGED') || 
           imageUrl.toLowerCase().includes('content flagged') ||
           imageUrl.toLowerCase().includes('sensitive'));
        const isLoading = !imageUrl || imageUrl === '';
        const isTimedOut = timedOutModels.has(model);
        const style = getModelStyle(model);

        // Show content flagged error with specific message
        if (isContentFlagged) {
          return (
            <div 
              key={model} 
              className={cn(
                "flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] rounded-xl border-2 overflow-hidden",
                "bg-destructive/5 border-destructive/30"
              )}
            >
              <div className="flex items-center px-3 py-2 border-b border-destructive/20">
                <span className="text-sm font-medium text-foreground truncate">
                  {formatModelName(model)}
                </span>
              </div>
              <div className="p-4 flex flex-col items-center justify-center gap-2 min-h-[200px]">
                <AlertCircle className="w-8 h-8 text-destructive/60" />
                <p className="text-sm text-center text-destructive/80 font-medium">
                  Content flagged as potentially sensitive
                </p>
                <p className="text-xs text-center text-muted-foreground">
                  Please try different prompts or images
                </p>
              </div>
            </div>
          );
        }

        // Show error message for failed models
        if (isError) {
          return (
            <div 
              key={model} 
              className={cn(
                "flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] rounded-xl border-2 overflow-hidden",
                "bg-destructive/5 border-destructive/30"
              )}
            >
              <div className="flex items-center px-3 py-2 border-b border-destructive/20">
                <span className="text-sm font-medium text-foreground truncate">
                  {formatModelName(model)}
                </span>
              </div>
              <div className="p-4 flex flex-col items-center justify-center gap-2 min-h-[200px]">
                <AlertCircle className="w-8 h-8 text-destructive/60" />
                <p className="text-sm text-center text-destructive/80 font-medium">
                  Model could not generate the image
                </p>
                <p className="text-xs text-center text-muted-foreground">
                  Please try a different prompt or select another model
                </p>
              </div>
            </div>
          );
        }

        // Show timeout error after 1 minute
        if (isTimedOut && isLoading) {
          return (
            <div 
              key={model} 
              className={cn(
                "flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] rounded-xl border-2 overflow-hidden",
                "bg-destructive/5 border-destructive/30"
              )}
            >
              <div className="flex items-center px-3 py-2 border-b border-destructive/20">
                <span className="text-sm font-medium text-foreground truncate">
                  {formatModelName(model)}
                </span>
              </div>
              <div className="p-4 flex flex-col items-center justify-center gap-2 min-h-[200px]">
                <AlertCircle className="w-8 h-8 text-destructive/60" />
                <p className="text-sm text-center text-destructive/80 font-medium">
                  Model could not generate the image
                </p>
                <p className="text-xs text-center text-muted-foreground">
                  Please try a different prompt or select another model
                </p>
              </div>
            </div>
          );
        }

               return <div key={model} className={cn("flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] rounded-xl border-2 overflow-hidden relative group", style.bg, style.border)}>
              {/* Model name label */}
              <div className="flex items-center px-3 py-2 border-b border-border/30">
                <span className="text-sm font-medium text-foreground truncate">
                  {formatModelName(model)}
                </span>
              </div>
              {/* Hover actions */}
              {!isLoading && <div className="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/60 backdrop-blur-sm hover:bg-background/80" onClick={() => handleCopyToClipboard(imageUrl, model)} title="Copy to clipboard">
                      {copiedModel === model ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/60 backdrop-blur-sm hover:bg-background/80" onClick={() => handleDownload(imageUrl, model)} title="Download image">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>}
              
              {/* Image content */}
              <div className="p-2">
                {isLoading ? <div className={`${aspectClass} rounded-lg overflow-hidden relative`}>
                    <Skeleton className="w-full h-full" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" />
                        <span className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-[bounce_1.4s_ease-in-out_infinite_0.2s]" />
                        <span className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-[bounce_1.4s_ease-in-out_infinite_0.4s]" />
                      </div>
                      <span className="text-xs text-muted-foreground/60">Generating</span>
                    </div>
               </div> : <img src={imageUrl} alt={`Generated by ${model}`} className={`w-full ${aspectClass} object-cover rounded-lg shadow-md animate-image-reveal`} onError={e => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }} loading="lazy" />}
              </div>
            </div>;
      })}
      </div>
      
      {/* Disclaimer section */}
      <p className="text-xs text-muted-foreground mt-4 px-1">
        <span className="font-medium">Note:</span> This image is generated by the selected model, not by Zebvo AI. Zebvo AI is not responsible for any blurry text, sensitive content, or mistakes that may appear in the image. For better accuracy, try multiple models and compare the results. Once you find the output you like, deselect the other models and use a single model consistently to get better results.
      </p>
    </div>;
};