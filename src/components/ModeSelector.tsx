import { InteractionMode } from '@/types';
import { Button } from './ui/button';
import { MessageSquare, Image, Video, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeSelectorProps {
  currentMode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
}

const modes: { value: InteractionMode; label: string; icon: typeof MessageSquare }[] = [
  { value: 'text', label: 'Text', icon: MessageSquare },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'build', label: 'Build', icon: Code },
];

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {modes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={currentMode === value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange(value)}
          className={cn(
            'gap-2',
            currentMode === value && 'shadow-sm'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
