import { useModeStore } from '../store/modeStore';
import type { Mode } from '@/types';
import { Image, Video, Code } from 'lucide-react';

const modes: { id: Mode; label: string; icon: any }[] = [
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'build', label: 'Build', icon: Code }
];

export const ModeSelector = () => {
  const { selectedMode, setMode } = useModeStore();
  
  return (
    <div className="inline-flex items-center gap-1.5 bg-muted/50 rounded-full p-0.5">
      {modes.map((mode) => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => setMode(mode.id)}
            className={`
              flex items-center gap-2 px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out
              ${selectedMode === mode.id 
                ? 'bg-background text-foreground shadow-sm scale-105' 
                : 'text-muted-foreground hover:text-foreground hover:scale-105'
              }
            `}
          >
            <Icon className={`w-4 h-4 transition-transform duration-200 ${selectedMode === mode.id ? 'scale-110' : ''}`} />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};
