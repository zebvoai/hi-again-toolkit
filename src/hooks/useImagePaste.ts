import { useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';

interface UseImagePasteOptions {
  onImagesAdded: (files: File[]) => void;
  enabled?: boolean;
}

export const useImagePaste = ({ onImagesAdded, enabled = true }: UseImagePasteOptions) => {
  const [isDragging, setIsDragging] = useState(false);

  // Handle paste from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!enabled) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      onImagesAdded(imageFiles);
      toast.success(`${imageFiles.length} image(s) pasted`);
    }
  }, [enabled, onImagesAdded]);

  // Handle drag events
  const handleDragEnter = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDragging(true);
    }
  }, [enabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Only set to false if we're leaving the window
    if (e.relatedTarget === null || !(e.relatedTarget as Node).nodeName) {
      setIsDragging(false);
    }
  }, [enabled]);

  const handleDragOver = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
  }, [enabled]);

  const handleDrop = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imageFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      onImagesAdded(imageFiles);
      toast.success(`${imageFiles.length} image(s) added`);
    } else {
      toast.error('Please drop image files only');
    }
  }, [enabled, onImagesAdded]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [enabled, handlePaste, handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return { isDragging };
};

// Utility to copy image to clipboard
export const copyImageToClipboard = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Create a canvas to convert the image to PNG (required for clipboard)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(false);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) {
            resolve(false);
            return;
          }
          
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': pngBlob
              })
            ]);
            resolve(true);
          } catch (err) {
            console.error('Failed to copy image:', err);
            resolve(false);
          }
        }, 'image/png');
      };
      
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Failed to copy image:', error);
    return false;
  }
};
