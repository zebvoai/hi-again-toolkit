import { useState } from 'react';
import { X, Download, Trash2, Sparkles, Upload, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageLightbox } from '@/components/ImageLightbox';
import { useUserImages, UserImage } from '../hooks/useUserImages';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LibraryViewProps {
  onClose: () => void;
}

export function LibraryView({ onClose }: LibraryViewProps) {
  const { images, isLoading, deleteImage } = useUserImages();
  const [selectedImage, setSelectedImage] = useState<UserImage | null>(null);
  const [imageToDelete, setImageToDelete] = useState<UserImage | null>(null);
  const [lightboxImage, setLightboxImage] = useState<UserImage | null>(null);
  const [filter, setFilter] = useState<'uploaded' | 'generated'>('generated');

  const filteredImages = images.filter(img => img.source_type === filter);

  const handleDownload = async (image: UserImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = image.filename || `image-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async () => {
    if (imageToDelete) {
      await deleteImage(imageToDelete.id);
      setImageToDelete(null);
      if (selectedImage?.id === imageToDelete.id) {
        setSelectedImage(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Fullscreen Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.url}
          alt={lightboxImage.filename || 'Image'}
          modelName={lightboxImage.model || undefined}
          onClose={() => setLightboxImage(null)}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <ImageIcon className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Library</h1>
            <p className="text-xs text-muted-foreground">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border/20">
        <Button
          variant={filter === 'uploaded' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('uploaded')}
          className="h-8 rounded-lg text-xs gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          Uploaded
        </Button>
        <Button
          variant={filter === 'generated' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('generated')}
          className="h-8 rounded-lg text-xs gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generated
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Gallery Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 pb-8 pr-4">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-base font-medium text-foreground/80 mb-1">No images yet</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  {filter === 'uploaded'
                    ? 'Upload images in your chats to see them here'
                    : 'Generate images with AI to see them here'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => setSelectedImage(image)}
                    onDoubleClick={() => setLightboxImage(image)}
                    className={cn(
                      "group relative aspect-square rounded-xl overflow-hidden cursor-pointer",
                      "bg-muted/50 border border-border/30",
                      "hover:border-primary/50 hover:shadow-lg transition-all duration-200",
                      selectedImage?.id === image.id &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    )}
                    title="Double-click for fullscreen"
                  >
                    <img
                      src={image.thumbnail_url || image.url}
                      alt={image.filename || 'Image'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      <div
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium backdrop-blur-sm",
                          image.source_type === 'generated'
                            ? "bg-primary/80 text-primary-foreground"
                            : "bg-black/50 text-white",
                        )}
                      >
                        {image.source_type === 'generated' ? (
                          <Sparkles className="w-3 h-3" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">
                          {image.source_type === 'generated' ? 'AI' : 'Upload'}
                        </span>
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="w-9 h-9 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="w-9 h-9 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageToDelete(image);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedImage && (
          <div className="hidden lg:flex flex-col w-80 min-h-0 border-l border-border/30 bg-card/50">
            <div className="p-4 border-b border-border/20">
              <h3 className="font-medium text-sm truncate">
                {selectedImage.filename || 'Untitled Image'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(selectedImage.created_at), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
            
            <ScrollArea className="flex-1 min-h-0 p-4">
              <div className="space-y-4">
                {/* Preview */}
                <div 
                  className="rounded-xl overflow-hidden border border-border/30 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setLightboxImage(selectedImage)}
                  title="Click for fullscreen"
                >
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.filename || 'Image'}
                    className="w-full"
                  />
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                    <div className="flex items-center gap-1.5">
                      {selectedImage.source_type === 'generated' ? (
                        <>
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span>AI Generated</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span>Uploaded</span>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedImage.model && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Model</p>
                      <p>{selectedImage.model}</p>
                    </div>
                  )}

                  {selectedImage.prompt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                      <p className="text-foreground/80 text-xs leading-relaxed">
                        {selectedImage.prompt}
                      </p>
                    </div>
                  )}

                  {selectedImage.size_bytes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Size</p>
                      <p>{(selectedImage.size_bytes / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-4 border-t border-border/20 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => handleDownload(selectedImage)}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.open(selectedImage.url, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setImageToDelete(selectedImage)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!imageToDelete} onOpenChange={() => setImageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this image from your library. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
