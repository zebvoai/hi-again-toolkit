import { useState, useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
      className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Full opaque backdrop */}
      <div className="absolute inset-0 bg-black" />
      
      {/* Model name badge - top left */}
      {modelName && (
        <div className="absolute top-6 left-6 z-20">
          <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-medium">
            {modelName}
          </div>
        </div>
      )}

      {/* Floating control bar - top right */}
      <div className="absolute top-6 right-6 z-20">
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setScale(s => Math.min(s + 0.25, 3))}
            title="Zoom in (+)"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
            title="Zoom out (-)"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setRotation(r => (r + 90) % 360)}
            title="Rotate (R)"
          >
            <RotateCw className="w-4.5 h-4.5" />
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={resetView}
            title="Reset view"
          >
            <Maximize2 className="w-4.5 h-4.5" />
          </button>
          
          <div className="w-px h-5 bg-white/20 mx-1" />
          
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="w-4.5 h-4.5" />
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Image container - centered */}
      <div className="relative z-10 flex items-center justify-center p-12">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt || 'Image preview'}
          className={cn(
            "max-w-[85vw] max-h-[85vh] object-contain rounded-lg transition-all duration-300 ease-out select-none",
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

      {/* Keyboard hints - bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/5 text-white/40 text-xs">
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">Esc</kbd> Close</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">+</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 ml-0.5">-</kbd> Zoom</span>
          <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">R</kbd> Rotate</span>
        </div>
      </div>
    </div>
  );
}
