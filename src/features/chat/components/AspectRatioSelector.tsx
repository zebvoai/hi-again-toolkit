import { memo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronDown } from 'lucide-react';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:2' | '2:3';

interface AspectRatioOption {
  value: AspectRatio;
  label: string;
  icon: { w: number; h: number };
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { value: '1:1', label: 'Square', icon: { w: 16, h: 16 } },
  { value: '16:9', label: 'Landscape', icon: { w: 20, h: 12 } },
  { value: '9:16', label: 'Portrait', icon: { w: 12, h: 20 } },
  { value: '3:2', label: 'Photo', icon: { w: 18, h: 12 } },
  { value: '2:3', label: 'Tall', icon: { w: 12, h: 18 } },
];

const RatioIcon = ({ ratio, isSelected }: { ratio: AspectRatioOption; isSelected: boolean }) => (
  <div
    className={cn(
      "rounded-[2px] border transition-colors duration-200",
      isSelected
        ? "border-primary bg-primary/20"
        : "border-muted-foreground/40 bg-muted-foreground/10"
    )}
    style={{ width: `${ratio.icon.w}px`, height: `${ratio.icon.h}px` }}
  />
);

interface AspectRatioSelectorProps {
  selected: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

export const AspectRatioSelector = memo(({ selected, onChange }: AspectRatioSelectorProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedRatio = ASPECT_RATIOS.find((r) => r.value === selected) || ASPECT_RATIOS[0];

  // Mobile: compact dropdown that opens upward
  if (isMobile) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
            "bg-primary/10 text-primary border border-primary/30"
          )}
        >
          <RatioIcon ratio={selectedRatio} isSelected />
          <span>{selectedRatio.value}</span>
          <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute bottom-full left-0 mb-1.5 bg-card border border-border rounded-lg shadow-lg z-50 py-1 min-w-[130px] animate-fade-in">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                type="button"
                onClick={() => { onChange(ratio.value); setOpen(false); }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors duration-150",
                  selected === ratio.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-accent/60"
                )}
              >
                <RatioIcon ratio={ratio} isSelected={selected === ratio.value} />
                <span>{ratio.value}</span>
                <span className="text-muted-foreground ml-auto">{ratio.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop: horizontal tiles (unchanged)
  return (
    <div className="flex items-center gap-1.5">
      {ASPECT_RATIOS.map((ratio) => (
        <button
          key={ratio.value}
          type="button"
          onClick={() => onChange(ratio.value)}
          className={cn(
            "flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all duration-200 text-xs",
            selected === ratio.value
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground border border-transparent"
          )}
          title={`${ratio.label} (${ratio.value})`}
        >
          <RatioIcon ratio={ratio} isSelected={selected === ratio.value} />
          <span className="font-medium leading-none">{ratio.value}</span>
        </button>
      ))}
    </div>
  );
});

AspectRatioSelector.displayName = 'AspectRatioSelector';
