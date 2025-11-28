import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModeStore } from '../store/modeStore';
import type { Mode } from '@/types';
import { Image, Video, Code } from 'lucide-react';

const modes: { id: Mode; label: string; icon: any }[] = [
  { id: 'text', label: 'Text', icon: Code },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'build', label: 'Build', icon: Code }
];

export const ModeDropdown = () => {
  const { selectedMode, setMode } = useModeStore();
  
  const selectedModeData = modes.find(m => m.id === selectedMode) || modes[0];
  const IconComponent = selectedModeData.icon;
  
  return (
    <Select value={selectedMode} onValueChange={(value: Mode) => setMode(value)}>
      <SelectTrigger className="w-auto border-0 bg-transparent rounded-lg text-sm px-3 py-1.5 h-8 hover:bg-white/30 dark:hover:bg-gray-700/30 transition-colors">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4" />
          <SelectValue placeholder="Select mode" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-2xl z-50">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <SelectItem 
              key={mode.id} 
              value={mode.id}
              className="hover:bg-white/50 dark:hover:bg-gray-700/50 focus:bg-white/50 dark:focus:bg-gray-700/50"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {mode.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
