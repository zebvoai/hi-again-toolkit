import { memo } from 'react';
import { cn } from '@/lib/utils';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:2' | '2:3';

interface AspectRatioOption {
  value: AspectRatio;
  label: string;
  icon: { w: number; h: number }; // relative proportions for the visual icon
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { value: '1:1', label: 'Square', icon: { w: 16, h: 16 } },
  { value: '16:9', label: 'Landscape', icon: { w: 20, h: 12 } },
  { value: '9:16', label: 'Portrait', icon: { w: 12, h: 20 } },
  { value: '3:2', label: 'Photo', icon: { w: 18, h: 12 } },
  { value: '2:3', label: 'Tall', icon: { w: 12, h: 18 } },
];

interface AspectRatioSelectorProps {
  selected: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

export const AspectRatioSelector = memo(({ selected, onChange }: AspectRatioSelectorProps) => {
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
          {/* Visual ratio icon */}
          <div
            className={cn(
              "rounded-[2px] border transition-colors duration-200",
              selected === ratio.value
                ? "border-primary bg-primary/20"
                : "border-muted-foreground/40 bg-muted-foreground/10"
            )}
            style={{
              width: `${ratio.icon.w}px`,
              height: `${ratio.icon.h}px`,
            }}
          />
          <span className="font-medium leading-none">{ratio.value}</span>
        </button>
      ))}
    </div>
  );
});

AspectRatioSelector.displayName = 'AspectRatioSelector';
