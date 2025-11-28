import { useChat } from '@/contexts/ChatContext';
import { InteractionMode } from '@/types/chat.types';
import { MODE_DESCRIPTIONS } from '@/constants/models';
import { MessageSquare, Image, Video, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODE_ICONS = {
  normal: MessageSquare,
  image: Image,
  video: Video,
  build: Code,
};

const MODE_LABELS = {
  normal: 'Chat',
  image: 'Image',
  video: 'Video',
  build: 'Build',
};

export function ModeSelector() {
  const { currentMode, setMode } = useChat();

  const modes: InteractionMode[] = ['normal', 'image', 'video', 'build'];

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {modes.map((mode) => {
        const Icon = MODE_ICONS[mode];
        const isActive = currentMode === mode;

        return (
          <button
            key={mode}
            onClick={() => setMode(mode)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title={MODE_DESCRIPTIONS[mode]}
          >
            <Icon className="h-4 w-4" />
            <span>{MODE_LABELS[mode]}</span>
          </button>
        );
      })}
    </div>
  );
}
