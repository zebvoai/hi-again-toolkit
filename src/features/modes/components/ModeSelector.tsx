import { useModeStore } from '../store/modeStore';
import type { Mode } from '@/types';
import { Image, Video, Code } from 'lucide-react';

const modes: { id: Mode; label: string }[] = [
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'build', label: 'Build' }
];

export const ModeSelector = () => {
  const { selectedMode, setMode } = useModeStore();
  
  return (
    <div className="inline-flex items-center gap-1.5 bg-muted/50 rounded-full p-0.5">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setMode(mode.id)}
          className={`
            px-5 py-1.5 rounded-full text-sm font-medium transition-all
            ${selectedMode === mode.id 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
};
