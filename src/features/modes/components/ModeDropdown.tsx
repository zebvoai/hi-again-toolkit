import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useModeStore } from '../store/modeStore';
import type { Mode } from '@/types';
import { MessageSquare, Image, Video, Code } from 'lucide-react';

const modes: { id: Mode; label: string; icon: any }[] = [
  { id: 'text', label: 'Text', icon: MessageSquare },
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
      <SelectTrigger className="w-auto min-w-[100px] border-0 bg-transparent rounded-lg text-sm px-3 py-1.5 h-8 hover:bg-accent transition-colors">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4" />
          <SelectValue placeholder="Select mode" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-background backdrop-blur-xl border shadow-lg z-[100]">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <SelectItem 
              key={mode.id} 
              value={mode.id}
              className="hover:bg-accent focus:bg-accent cursor-pointer"
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
