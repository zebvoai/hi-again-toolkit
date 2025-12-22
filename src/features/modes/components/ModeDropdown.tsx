import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useModeStore } from '../store/modeStore';
import type { Mode } from '@/types';
import { MessageSquare, Image, Code, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagePasswordDialog } from './ImagePasswordDialog';

const modes: { id: Mode; label: string; icon: any; description: string; comingSoon?: boolean }[] = [
  { id: 'text', label: 'Text', icon: MessageSquare, description: 'Chat with AI' },
  { id: 'research', label: 'Deep Research', icon: Search, description: 'Multi-source research' },
  { id: 'image', label: 'Image', icon: Image, description: 'Generate images' },
  { id: 'build', label: 'Build', icon: Code, description: 'Build apps', comingSoon: true }
];

const IMAGE_MODE_UNLOCKED_KEY = 'zebvo_image_mode_unlocked';

export const ModeDropdown = () => {
  const { selectedMode, setMode } = useModeStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isImageModeUnlocked, setIsImageModeUnlocked] = useState(false);
  
  // Check if image mode was previously unlocked
  useEffect(() => {
    const unlocked = localStorage.getItem(IMAGE_MODE_UNLOCKED_KEY) === 'true';
    setIsImageModeUnlocked(unlocked);
  }, []);
  
  const selectedModeData = modes.find(m => m.id === selectedMode) || modes[0];
  const IconComponent = selectedModeData.icon;
  
  const handleModeChange = (value: Mode) => {
    const mode = modes.find(m => m.id === value);
    if (mode?.comingSoon) return;
    
    // If trying to select image mode and it's not unlocked, show password dialog
    if (value === 'image' && !isImageModeUnlocked) {
      setShowPasswordDialog(true);
      return;
    }
    
    setMode(value);
  };
  
  const handleImageModeUnlock = () => {
    localStorage.setItem(IMAGE_MODE_UNLOCKED_KEY, 'true');
    setIsImageModeUnlocked(true);
    setMode('image');
  };
  
  return (
    <>
      <Select value={selectedMode} onValueChange={handleModeChange}>
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
            const isDisabled = mode.comingSoon;
            const isLocked = mode.id === 'image' && !isImageModeUnlocked;
            return (
              <SelectItem 
                key={mode.id} 
                value={mode.id}
                disabled={isDisabled}
                className={cn(
                  "rounded-xl cursor-pointer transition-all duration-200 my-0.5 px-3 py-2.5",
                  "hover:bg-blue-50/80 dark:hover:bg-blue-900/20",
                  "focus:bg-blue-50/80 dark:focus:bg-blue-900/20",
                  "data-[state=checked]:bg-blue-50 dark:data-[state=checked]:bg-blue-900/30",
                  isSelected && "bg-blue-50 dark:bg-blue-900/30",
                  isDisabled && "opacity-60 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                    isSelected 
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30" 
                      : "bg-gray-100 dark:bg-gray-800",
                    isDisabled && "opacity-50"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4 transition-colors",
                      isSelected ? "text-white" : "text-gray-600 dark:text-gray-400"
                    )} />
                  </span>
                  <span className="flex flex-col items-start">
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-gray-100",
                        isDisabled && "text-gray-500 dark:text-gray-500"
                      )}>
                        {mode.label}
                      </span>
                      {isDisabled && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          Coming Soon
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          🔒 Locked
                        </span>
                      )}
                    </span>
                    <span className={cn(
                      "text-xs text-gray-500 dark:text-gray-400",
                      isDisabled && "text-gray-400 dark:text-gray-600"
                    )}>
                      {mode.description}
                    </span>
                  </span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      <ImagePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={handleImageModeUnlock}
      />
    </>
  );
};