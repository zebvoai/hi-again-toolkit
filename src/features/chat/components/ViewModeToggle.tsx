interface ViewModeToggleProps {
  viewMode: 'single' | 'sideBySide';
  onViewModeChange: (mode: 'single' | 'sideBySide') => void;
  modelInfo: string;
}

export const ViewModeToggle = ({ viewMode, onViewModeChange, modelInfo }: ViewModeToggleProps) => {
  return (
    <div className="flex items-center justify-end gap-3 px-6">
      <span className="text-[12px] text-muted-foreground/70 font-medium">
        {modelInfo}
      </span>
      <div className="relative flex items-center p-[3px] bg-muted/40 rounded-full border border-border/30 backdrop-blur-sm">
        {/* Animated pill background */}
        <div 
          className="absolute h-[calc(100%-6px)] rounded-full bg-card shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ 
            left: viewMode === 'single' ? '3px' : 'calc(50%)',
            width: 'calc(50% - 3px)'
          }}
        />
        <button 
          onClick={() => onViewModeChange('single')}
          className={`relative z-10 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
            viewMode === 'single' 
              ? 'text-foreground' 
              : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          Single
        </button>
        <button 
          onClick={() => onViewModeChange('sideBySide')}
          className={`relative z-10 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
            viewMode === 'sideBySide' 
              ? 'text-foreground' 
              : 'text-muted-foreground hover:text-foreground/80'
          }`}
        >
          Compare
        </button>
      </div>
    </div>
  );
};
