import { useState, useEffect, useRef } from 'react';
import { useModeStore } from '../store/modeStore';
import type { Mode } from '@/types';
import { MessageSquare, Image, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const modes: { id: Mode; label: string; icon: any }[] = [
  { id: 'text', label: 'Text', icon: MessageSquare },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'research', label: 'Research', icon: Search },
];

export const ModeDropdown = () => {
  const { selectedMode, setMode } = useModeStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  
  const handleModeChange = (value: Mode) => {
    setMode(value);
    setOpen(false);
  };

  const selectedModeData = modes.find((m) => m.id === selectedMode) || modes[0];
  const SelectedIcon = selectedModeData.icon;

  // Mobile: compact dropdown opening upward
  if (isMobile) {
    return (
      <>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200",
              "bg-card border-2 border-primary shadow-sm"
            )}
          >
            <div className="w-4 h-4 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <SelectedIcon className="w-2.5 h-2.5" />
            </div>
            <span className="text-foreground">{selectedModeData.label}</span>
            <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
          </button>

          {open && (
            <div className="absolute bottom-full left-0 mb-1.5 bg-card border border-border rounded-xl shadow-lg z-50 py-1 min-w-[140px] animate-fade-in">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const isSelected = mode.id === selectedMode;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleModeChange(mode.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2.5 text-xs transition-colors duration-150",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-accent/60"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-lg flex items-center justify-center",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isSelected = mode.id === selectedMode;
        
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
          </button>
        );
      })}
    </div>
  );
};
