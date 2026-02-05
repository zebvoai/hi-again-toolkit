import { Skeleton } from '@/components/ui/skeleton';
import { formatModelName } from '@/lib/utils';
import { Columns2 } from 'lucide-react';

interface TextResponseSkeletonProps {
  models: string[];
}

const getProviderColor = (model: string): string => {
  const modelLower = model.toLowerCase();
  if (modelLower.includes('gpt') || modelLower.includes('openai')) return 'from-emerald-500 to-teal-600';
  if (modelLower.includes('gemini') || modelLower.includes('google')) return 'from-blue-500 to-indigo-600';
  if (modelLower.includes('claude') || modelLower.includes('anthropic')) return 'from-orange-400 to-amber-600';
  if (modelLower.includes('perplexity')) return 'from-purple-500 to-violet-600';
  if (modelLower.includes('qwen')) return 'from-cyan-500 to-blue-600';
  if (modelLower.includes('cohere')) return 'from-rose-500 to-pink-600';
  return 'from-slate-500 to-slate-600';
};

export const TextResponseSkeleton = ({ models }: TextResponseSkeletonProps) => {
  // Single model skeleton
  if (models.length === 1) {
    const model = models[0];
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 appear-smooth">
        <div className="flex gap-2.5 max-w-[75%]">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/35 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-primary font-semibold text-[10px]">Z</span>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Model name */}
            <div className="flex items-center gap-1.5 mb-1 ml-0.5">
              <span className="text-[10px] font-medium text-muted-foreground/70">
                {formatModelName(model)}
              </span>
            </div>
            
            {/* Content skeleton */}
            <div className="rounded-2xl rounded-bl-md bg-card border border-border/30 px-4 py-3 space-y-2.5">
              <Skeleton className="h-3.5 w-[90%]" />
              <Skeleton className="h-3.5 w-[75%]" />
              <Skeleton className="h-3.5 w-[85%]" />
              <Skeleton className="h-3.5 w-[60%]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Multi-model skeleton - compare view layout
  return (
    <div className="w-full appear-smooth">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 px-4 sm:px-6">
        <div className="inline-flex items-center p-0.5 bg-muted/40 rounded-lg border border-border/30">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-card text-foreground shadow-sm">
            <Columns2 className="w-3.5 h-3.5" />
            Compare
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          Generating from {models.length} models
        </span>
      </div>

      {/* Scrollable skeleton cards */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div className="overflow-x-auto scrollbar-hide scroll-smooth pb-2">
          <div className="flex gap-3 px-4 sm:px-6" style={{ minWidth: 'min-content' }}>
            {models.map((model, idx) => (
              <div
                key={model}
                className="w-[300px] sm:w-[340px] lg:w-[380px] flex-shrink-0 flex flex-col bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden"
                style={{ minHeight: '200px', maxHeight: '400px' }}
              >
                {/* Card Header */}
                <div className="flex-shrink-0 h-11 px-3 border-b border-border/20 bg-muted/20 flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${getProviderColor(model)}`} />
                  <span className="text-[13px] font-medium text-foreground truncate flex-1">
                    {formatModelName(model)}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                </div>

                {/* Skeleton content */}
                <div className="flex-1 p-3 space-y-2.5">
                  <Skeleton className="h-3.5 w-[95%]" />
                  <Skeleton className="h-3.5 w-[80%]" />
                  <Skeleton className="h-3.5 w-[88%]" />
                  <Skeleton className="h-3.5 w-[70%]" />
                  <Skeleton className="h-3.5 w-[85%]" />
                  <Skeleton className="h-3.5 w-[65%]" />
                </div>

                {/* Card Footer */}
                <div className="flex-shrink-0 h-9 px-2 border-t border-border/15 bg-muted/10 flex items-center">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
