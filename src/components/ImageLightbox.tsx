import { useState, useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Controls - Top */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        {/* Model name */}
        {modelName && (
          <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium">
            {modelName}
          </div>
        )}
        {!modelName && <div />}
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            onClick={() => setScale(s => Math.min(s + 0.25, 3))}
            title="Zoom in (+)"
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}
            title="Zoom out (-)"
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            onClick={() => setRotation(r => (r + 90) % 360)}
            title="Rotate (R)"
          >
            <RotateCw className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt || 'Image preview'}
          className={cn(
            "max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all duration-300 ease-out",
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

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/50 text-xs">
        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> Close</span>
        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">+</kbd><kbd className="px-1.5 py-0.5 bg-white/10 rounded ml-1">-</kbd> Zoom</span>
        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">R</kbd> Rotate</span>
      </div>
    </div>
  );
}
