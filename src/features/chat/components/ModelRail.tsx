import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ModelRailProps {
  models: string[];
  selectedModels: string[];
  onToggle: (model: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  sidebarWidth: number;
}

// Model provider icons/colors
const getModelStyle = (model: string): { bg: string; text: string; accent: string } => {
  const lowerModel = model.toLowerCase();
  
  // Text model styles
  if (lowerModel.includes('gpt')) {
    return { bg: 'bg-emerald-500/10', text: 'text-emerald-600', accent: 'border-emerald-500/30' };
  }
  if (lowerModel.includes('claude') || lowerModel.includes('opus')) {
    return { bg: 'bg-orange-500/10', text: 'text-orange-600', accent: 'border-orange-500/30' };
  }
  if (lowerModel.includes('gemini') || lowerModel.includes('gemma')) {
    return { bg: 'bg-blue-500/10', text: 'text-blue-600', accent: 'border-blue-500/30' };
  }
  if (lowerModel.includes('grok')) {
    return { bg: 'bg-slate-500/10', text: 'text-slate-600', accent: 'border-slate-500/30' };
  }
  if (lowerModel.includes('deepseek')) {
    return { bg: 'bg-cyan-500/10', text: 'text-cyan-600', accent: 'border-cyan-500/30' };
  }
  if (lowerModel.includes('qwen')) {
    return { bg: 'bg-purple-500/10', text: 'text-purple-600', accent: 'border-purple-500/30' };
  }
  if (lowerModel.includes('mistral')) {
    return { bg: 'bg-amber-500/10', text: 'text-amber-600', accent: 'border-amber-500/30' };
  }
  if (lowerModel.includes('llama') || lowerModel.includes('maverick')) {
    return { bg: 'bg-indigo-500/10', text: 'text-indigo-600', accent: 'border-indigo-500/30' };
  }
  if (lowerModel.includes('minimax')) {
    return { bg: 'bg-pink-500/10', text: 'text-pink-600', accent: 'border-pink-500/30' };
  }
  if (lowerModel.includes('command') || lowerModel.includes('cohere')) {
    return { bg: 'bg-rose-500/10', text: 'text-rose-600', accent: 'border-rose-500/30' };
  }
  if (lowerModel.includes('perplexity') || lowerModel.includes('sonar')) {
    return { bg: 'bg-teal-500/10', text: 'text-teal-600', accent: 'border-teal-500/30' };
  }
  if (lowerModel.includes('kimi')) {
    return { bg: 'bg-violet-500/10', text: 'text-violet-600', accent: 'border-violet-500/30' };
  }
  if (lowerModel.includes('phi')) {
    return { bg: 'bg-sky-500/10', text: 'text-sky-600', accent: 'border-sky-500/30' };
  }
  if (lowerModel.includes('nemotron') || lowerModel.includes('nvidia')) {
    return { bg: 'bg-lime-500/10', text: 'text-lime-600', accent: 'border-lime-500/30' };
  }
  
  // Image model styles
  if (lowerModel.includes('vidu')) {
    return { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-600', accent: 'border-fuchsia-500/30' };
  }
  if (lowerModel.includes('wan')) {
    return { bg: 'bg-amber-500/10', text: 'text-amber-600', accent: 'border-amber-500/30' };
  }
  if (lowerModel.includes('nano') || lowerModel.includes('banana')) {
    return { bg: 'bg-yellow-500/10', text: 'text-yellow-600', accent: 'border-yellow-500/30' };
  }
  if (lowerModel.includes('imagine')) {
    return { bg: 'bg-slate-500/10', text: 'text-slate-600', accent: 'border-slate-500/30' };
  }
  
  return { bg: 'bg-muted', text: 'text-foreground', accent: 'border-border' };
};

export function ModelRail({ models, selectedModels, onToggle, onSelectAll, onClearAll, sidebarWidth }: ModelRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const allSelected = models.length > 0 && selectedModels.length === models.length;
  const noneSelected = selectedModels.length === 0;

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

  return (
    <div 
      className="fixed top-0 right-0 bg-background/80 backdrop-blur-sm border-b border-border/30 z-10"
      style={{ left: sidebarWidth }}
    >
      <div className="flex items-center gap-3 pl-6 pr-4 py-3">
        {/* Quick Actions */}
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <button
            onClick={allSelected ? onClearAll : onSelectAll}
            className={cn(
              "ml-2 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              allSelected
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"
            )}
          >
            {allSelected ? 'Clear All' : 'Select All'}
          </button>
          <span className="text-xs text-muted-foreground/60 tabular-nums">
            {selectedModels.length}/{models.length}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 flex-shrink-0" />

        {/* Horizontal Scroll Rail */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="flex items-center gap-2 py-0.5">
            {models.map((model) => {
              const isSelected = selectedModels.includes(model);
              const style = getModelStyle(model);
              
              return (
                <button
                  key={model}
                  onClick={() => onToggle(model)}
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200",
                    "whitespace-nowrap text-sm font-medium flex-shrink-0",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    isSelected
                      ? cn(style.bg, style.text, style.accent, "shadow-sm")
                      : "bg-muted/30 text-muted-foreground/50 border-transparent opacity-50 hover:opacity-70"
                  )}
                >
                  {/* Toggle Indicator */}
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      isSelected 
                        ? "bg-current scale-100" 
                        : "bg-muted-foreground/30 scale-75"
                    )}
                  />
                  
                  {/* Model Name */}
                  <span className="truncate max-w-[140px]">{model}</span>
                  
                  {/* Subtle hover glow for selected */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-xl bg-current opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
