import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useModeStore } from '../store/modeStore';
import type { Mode } from '@/types';
import { MessageSquare, Image, Video, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

const modes: { id: Mode; label: string; icon: any; description: string }[] = [
  { id: 'text', label: 'Text', icon: MessageSquare, description: 'Chat with AI' },
  { id: 'image', label: 'Image', icon: Image, description: 'Generate images' },
  { id: 'video', label: 'Video', icon: Video, description: 'Create videos' },
  { id: 'build', label: 'Build', icon: Code, description: 'Build apps' }
];

export const ModeDropdown = () => {
  const { selectedMode, setMode } = useModeStore();
  
  const selectedModeData = modes.find(m => m.id === selectedMode) || modes[0];
  const IconComponent = selectedModeData.icon;
  
  return (
    <Select value={selectedMode} onValueChange={(value: Mode) => setMode(value)}>
      <SelectTrigger className="w-auto min-w-[110px] border border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl text-sm px-3 py-2 h-9 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-200 shadow-sm hover:shadow-md [&>svg]:hidden">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <IconComponent className="w-3 h-3 text-white" />
          </div>
          <span className="font-medium">{selectedModeData.label}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="w-[220px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-2xl p-1 z-[100]">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = mode.id === selectedMode;
          return (
            <SelectItem 
              key={mode.id} 
              value={mode.id}
              className={cn(
                "rounded-xl cursor-pointer transition-all duration-200 my-0.5 px-3 py-2.5",
                "hover:bg-blue-50/80 dark:hover:bg-blue-900/20",
                "focus:bg-blue-50/80 dark:focus:bg-blue-900/20",
                "data-[state=checked]:bg-blue-50 dark:data-[state=checked]:bg-blue-900/30",
                isSelected && "bg-blue-50 dark:bg-blue-900/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                  isSelected 
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30" 
                    : "bg-gray-100 dark:bg-gray-800"
                )}>
                  <Icon className={cn(
                    "w-4 h-4 transition-colors",
                    isSelected ? "text-white" : "text-gray-600 dark:text-gray-400"
                  )} />
                </div>
                <div className="flex flex-col items-start">
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"
                  )}>
                    {mode.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {mode.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
