import { useState, useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Copy, Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { copyImageToClipboard } from '@/hooks/useImagePaste';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
  modelName?: string;
}

export function ImageLightbox({ src, alt, onClose, modelName }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 3));
      if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.5));
      if (e.key === 'r') setRotation(r => (r + 90) % 360);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = modelName 
        ? `${modelName.replace(/\s+/g, '-')}-${Date.now()}.png`
        : `image-${Date.now()}.png`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
    }
  }, [src, modelName]);

  const handleCopy = useCallback(async () => {
    setCopied(true);
    const success = await copyImageToClipboard(src);
    if (success) {
      toast.success('Image copied to clipboard');
    } else {
      toast.error('Failed to copy image');
    }
    setTimeout(() => setCopied(false), 2000);
  }, [src]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const resetView = () => {
    setScale(1);
    setRotation(0);
  };

  const canPan = scale > 1.01;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={handleBackdropClick}
    >
      {/* Backdrop (nearly opaque, respects theme) */}
      <div className="absolute inset-0 bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-xl" />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 flex w-[min(92vw,900px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
          "h-[min(82vh,720px)]"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="h-9 w-9 rounded-full inline-flex items-center justify-center bg-muted/60 text-foreground hover:bg-muted transition-colors"
              onClick={onClose}
              title="Close"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {modelName && (
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {modelName}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!isMobile && (
              <>
                <button
                  className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  onClick={() => setScale(s => Math.min(s + 0.25, 3))}
                  title="Zoom in (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
                  title="Zoom out (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Rotate (R)"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  onClick={resetView}
                  title="Reset view"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <div className="mx-1 h-5 w-px bg-border" />
              </>
            )}

            <button
              className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div
          className={cn(
            "relative flex-1 min-h-0 flex items-center justify-center bg-muted/10",
            canPan ? "overflow-auto scrollbar-hide" : "overflow-hidden"
          )}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-9 w-9 rounded-full border-2 border-border border-t-foreground/70 animate-spin" />
            </div>
          )}

          <img
            src={src}
            alt={alt || 'Image preview'}
            className={cn(
              "max-w-full max-h-full object-contain rounded-xl shadow-sm transition-all duration-300 ease-out select-none",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              toast.error('Failed to load image');
            }}
            draggable={false}
          />
        </div>

        {/* Footer hints (desktop only, compact) */}
        {!isMobile && (
          <div className="px-4 py-2 border-t border-border bg-muted/20">
            <div className="flex items-center justify-center gap-4 text-muted-foreground text-xs">
              <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground/70">Esc</kbd> Close</span>
              <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground/70">+</kbd> <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground/70 ml-0.5">-</kbd> Zoom</span>
              <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground/70">R</kbd> Rotate</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
