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

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      
      {/* Modal container - constrained size */}
      <div 
        className="relative z-10 w-full max-w-4xl max-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
          {/* Left: Back + Model name */}
          <div className="flex items-center gap-3">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={onClose}
              title="Close"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {modelName && (
              <span className="text-sm font-medium text-white/90 truncate max-w-[200px]">
                {modelName}
              </span>
            )}
          </div>

          {/* Right: Action controls */}
          <div className="flex items-center gap-1">
            {!isMobile && (
              <>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setScale(s => Math.min(s + 0.25, 3))}
                  title="Zoom in (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
                  title="Zoom out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  title="Rotate (R)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={resetView}
                  title="Reset view"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-white/20 mx-1" />
              </>
            )}
            
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image container */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto min-h-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <img
            src={src}
            alt={alt || 'Image preview'}
            className={cn(
              "max-w-full max-h-[calc(85vh-120px)] object-contain rounded-lg shadow-xl transition-all duration-300 ease-out select-none",
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

        {/* Footer: Keyboard hints (desktop only) */}
        {!isMobile && (
          <div className="px-4 py-2 border-t border-white/5 bg-black/20">
            <div className="flex items-center justify-center gap-4 text-white/40 text-xs">
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">Esc</kbd> Close</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">+</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 ml-0.5">-</kbd> Zoom</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">R</kbd> Rotate</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
