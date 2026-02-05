import { useState, useEffect } from 'react';
import { useModeStore } from '../store/modeStore';
import type { Mode } from '@/types';
import { MessageSquare, Image, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagePasswordDialog } from './ImagePasswordDialog';

const modes: { id: Mode; label: string; icon: any }[] = [
  { id: 'text', label: 'Text', icon: MessageSquare },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'research', label: 'Research', icon: Search },
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
  
  const handleModeChange = (value: Mode) => {
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
      <div className="flex items-center gap-1.5">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = mode.id === selectedMode;
          const isLocked = mode.id === 'image' && !isImageModeUnlocked;
          
          return (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                "hover:bg-accent/80 active:scale-[0.98]",
                isSelected 
                  ? "bg-card border-2 border-primary shadow-sm" 
                  : "bg-muted/50 border-2 border-transparent hover:border-border/50"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-lg flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                <Icon className="w-3 h-3" />
              </div>
              <span className={cn(
                "transition-colors",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>
                {mode.label}
              </span>
              {isLocked && (
                <span className="text-[10px]">🔒</span>
              )}
            </button>
          );
        })}
      </div>
      
      <ImagePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={handleImageModeUnlock}
      />
    </>
  );
};
