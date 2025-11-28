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
    <div className="inline-flex items-center gap-1.5 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-full p-1 shadow-lg border border-white/20 dark:border-gray-700/30">
      {modes.map((mode) => {
        const IconComponent = mode.icon;
        return (
          <button
            key={mode.id}
            onClick={() => setMode(mode.id)}
            className={`
              flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out
              ${selectedMode === mode.id 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-gray-700/30 hover:scale-105'
              }
            `}
          >
            <IconComponent className={`w-4 h-4 transition-transform duration-200 ${selectedMode === mode.id ? 'scale-110' : ''}`} />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};
