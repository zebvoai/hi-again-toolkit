import { useModeStore } from '../store/modeStore';
import type { Mode } from '@/types';
import { Image, Video, Code } from 'lucide-react';

const modes: { id: Mode; label: string; icon: React.ReactNode }[] = [
  { id: 'image', label: 'Image', icon: <Image className="w-4 h-4" /> },
  { id: 'video', label: 'Video', icon: <Video className="w-4 h-4" /> },
  { id: 'build', label: 'Build', icon: <Code className="w-4 h-4" /> }
];

export const ModeSelector = () => {
  const { selectedMode, setMode } = useModeStore();
  
  return (
    <div className="flex items-center justify-center gap-3">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => setMode(mode.id)}
          className={`
            px-6 py-2.5 rounded-full flex items-center gap-2 transition-all
            ${selectedMode === mode.id 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-accent'
            }
          `}
        >
          {mode.icon}
          <span className="text-sm font-medium">{mode.label}</span>
        </button>
      ))}
    </div>
  );
};
