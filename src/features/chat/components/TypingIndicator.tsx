import { useChatStore } from '@/features/chat/store/chatStore';
import { formatModelName } from '@/lib/utils';
import { Search, ImageIcon, FileText, Sparkles } from 'lucide-react';
import type { GenerationActivityType } from '@/features/chat/types';

const activityConfig: Record<string, { icon: typeof Search; text: string; textColor: string; bgColor: string }> = {
  searching_web: { icon: Search, text: 'Searching web', textColor: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  analyzing_image: { icon: ImageIcon, text: 'Analyzing image', textColor: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  analyzing_pdf: { icon: FileText, text: 'Analyzing PDF', textColor: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  generating: { icon: Sparkles, text: 'Generating', textColor: 'text-primary', bgColor: 'bg-primary/10' },
};

export const TypingIndicator = ({ models }: { models?: string[] }) => {
  const currentGeneratingModel = useChatStore((s) => s.currentGeneratingModel);
  const generationActivityType = useChatStore((s) => s.generationActivityType);
  
  const displayModel = currentGeneratingModel ? formatModelName(currentGeneratingModel) : null;
  const activity = generationActivityType && activityConfig[generationActivityType];
  
  return (
    <div className="flex justify-start mb-4 appear-smooth">
      <div className="flex gap-2 max-w-[75%]">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/50 flex items-center justify-center shadow-sm flex-shrink-0 transition-transform duration-normal ease-spring hover:scale-hover">
          <span className="text-primary font-semibold text-sm">Z</span>
        </div>
        
        {/* Thinking bubble with model indicator */}
        <div className="flex flex-col gap-1.5">
          {/* Model + activity indicator */}
          <div className="flex items-center gap-1.5 animate-fade-in flex-wrap">
            {displayModel && (
              <>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Generating with
                </span>
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                  {displayModel}
                </span>
              </>
            )}
            {activity && activity.text !== 'Generating' && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${activity.textColor} ${activity.bgColor}`}>
                <activity.icon className="w-3 h-3" />
                {activity.text}
              </span>
            )}
          </div>
          
          {/* Thinking bubble with Apple-style wave dots */}
          <div className="rounded-[18px_18px_18px_4px] px-5 py-3.5 bg-muted shadow-sm transition-all duration-normal">
            <div className="flex items-center gap-[5px]">
              <span 
                className="w-[7px] h-[7px] rounded-full bg-muted-foreground/50 animate-thinking-dot"
                style={{ animationDelay: '0ms' }}
              />
              <span 
                className="w-[7px] h-[7px] rounded-full bg-muted-foreground/50 animate-thinking-dot"
                style={{ animationDelay: '160ms' }}
              />
              <span 
                className="w-[7px] h-[7px] rounded-full bg-muted-foreground/50 animate-thinking-dot"
                style={{ animationDelay: '320ms' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
