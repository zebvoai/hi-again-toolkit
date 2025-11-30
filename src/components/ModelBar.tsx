import { RefreshCw, Copy, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/features/chat/store/chatStore';

export function ModelBar() {
  const { selectedModels } = useChatStore();

  // Get model icon based on model name
  const getModelIcon = (model: string) => {
    if (model.includes('GPT')) return '⚡';
    if (model.includes('Claude')) return '🔷';
    if (model.includes('Gemini')) return '💎';
    return '🤖';
  };

  if (selectedModels.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40 flex items-center px-6 gap-4">
      {selectedModels.map((model, index) => (
        <div
          key={index}
          className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors"
        >
          {/* Model Icon */}
          <div className="text-xl">{getModelIcon(model)}</div>

          {/* Model Name Dropdown */}
          <button className="flex items-center gap-2 text-sm font-medium">
            <span>{model}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="icon" className="w-7 h-7">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7">
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Toggle */}
          <div className="ml-2 w-10 h-6 bg-primary rounded-full flex items-center justify-end px-1">
            <div className="w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
