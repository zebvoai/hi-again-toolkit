import { Skeleton } from '@/components/ui/skeleton';
import { formatModelName } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ImageResponseSkeletonProps {
  models: string[];
}

// Model provider colors (matching MultiModelImageResponse)
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

export const ImageResponseSkeleton = ({ models }: ImageResponseSkeletonProps) => {
  return (
    <div className="w-full appear-smooth">
      {/* Horizontal scroll container */}
      <div 
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8"
        style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {models.map((model) => {
          const style = getModelStyle(model);
          
          return (
            <div 
              key={model} 
              className={cn(
                "flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] rounded-xl border-2 overflow-hidden",
                style.bg,
                style.border
              )}
            >
              {/* Model header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
                <span className="text-sm font-medium text-foreground truncate">
                  {formatModelName(model)}
                </span>
              </div>
              
              {/* Image skeleton - 1:1 aspect ratio */}
              <div className="p-2">
                <div className="aspect-square bg-background/50 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full relative">
                    {/* Shimmer effect */}
                    <Skeleton className="w-full h-full rounded-lg" />
                    {/* Centered subtle indicator */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" />
                        <span className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-[bounce_1.4s_ease-in-out_infinite_0.2s]" />
                        <span className="w-1.5 h-1.5 bg-foreground/20 rounded-full animate-[bounce_1.4s_ease-in-out_infinite_0.4s]" />
                      </div>
                      <span className="text-xs text-muted-foreground/60">Generating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
