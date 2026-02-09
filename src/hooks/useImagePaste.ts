import { useEffect, useCallback, useState } from 'react';
import { toast } from 'sonner';

// Supported file types for drag and drop
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const SUPPORTED_DOCUMENT_TYPES = ['application/pdf'];
const ALL_SUPPORTED_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOCUMENT_TYPES];

interface UseImagePasteOptions {
  onImagesAdded: (files: File[]) => void;
  enabled?: boolean;
}

export const useImagePaste = ({ onImagesAdded, enabled = true }: UseImagePasteOptions) => {
  const [isDragging, setIsDragging] = useState(false);

  // Check if a file is a supported type
  const isSupportedFile = (file: File): boolean => {
    // Check by MIME type
    if (ALL_SUPPORTED_TYPES.includes(file.type)) return true;
    // Fallback: check by extension for PDFs (some systems may not set MIME correctly)
    if (file.name.toLowerCase().endsWith('.pdf')) return true;
    // Check for image extensions as fallback
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)) return true;
    return false;
  };

  const isImageFile = (file: File): boolean => {
    return SUPPORTED_IMAGE_TYPES.includes(file.type) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
  };

  const isPdfFile = (file: File): boolean => {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  };

  // Handle paste from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!enabled) return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    const supportedFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // Support images from clipboard
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          supportedFiles.push(file);
        }
      }
      // Note: PDFs typically can't be pasted from clipboard, only dragged
    }

    if (supportedFiles.length > 0) {
      e.preventDefault();
      onImagesAdded(supportedFiles);
      toast.success(`${supportedFiles.length} image(s) pasted`);
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

    const supportedFiles: File[] = [];
    const unsupportedFiles: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (isSupportedFile(file)) {
        supportedFiles.push(file);
      } else {
        unsupportedFiles.push(file.name);
      }
    }

    if (supportedFiles.length > 0) {
      onImagesAdded(supportedFiles);
      
      // Count images and PDFs for better toast message
      const imageCount = supportedFiles.filter(isImageFile).length;
      const pdfCount = supportedFiles.filter(isPdfFile).length;
      
      if (imageCount > 0 && pdfCount > 0) {
        toast.success(`${imageCount} image(s) and ${pdfCount} PDF(s) added`);
      } else if (pdfCount > 0) {
        toast.success(`${pdfCount} PDF(s) added`);
      } else {
        toast.success(`${imageCount} image(s) added`);
      }
    }
    
    if (unsupportedFiles.length > 0 && supportedFiles.length === 0) {
      toast.error('Please drop images or PDF files');
    } else if (unsupportedFiles.length > 0) {
      toast.warning(`${unsupportedFiles.length} unsupported file(s) skipped`);
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
