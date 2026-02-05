import { useState, useRef } from 'react';
import { Bug, Upload, X, Image as ImageIcon, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackType = 'bug' | 'feature';

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [type, setType] = useState<FeedbackType>('bug');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (newFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    // Limit to 5 images
    const totalImages = images.length + newFiles.length;
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages(prev => [...prev, ...newFiles]);

    // Create preview URLs
    newFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setImagePreviewUrls(prev => [...prev, url]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of images) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    if (!user) {
      toast.error('Please sign in to submit feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images first
      const imageUrls = await uploadImages();

      // Insert feedback
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        type,
        description: description.trim(),
        image_urls: imageUrls,
      } as any);

      if (error) throw error;

      toast.success(type === 'bug' ? 'Bug report submitted!' : 'Feature suggestion submitted!');
      
      // Reset form
      setDescription('');
      setType('bug');
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setImages([]);
      setImagePreviewUrls([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Bug className="w-5 h-5 text-primary" />
            Send Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'bug' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('bug')}
                className={cn(
                  "flex-1 gap-2 rounded-xl",
                  type === 'bug' && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
              >
                <Bug className="w-4 h-4" />
                Bug Report
              </Button>
              <Button
                type="button"
                variant={type === 'feature' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setType('feature')}
                className={cn(
                  "flex-1 gap-2 rounded-xl",
                  type === 'feature' && "bg-primary text-primary-foreground"
                )}
              >
                <Lightbulb className="w-4 h-4" />
                Feature Request
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {type === 'bug' ? 'Describe the bug' : 'Describe your idea'}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'bug'
                  ? 'What happened? What did you expect to happen?'
                  : 'What feature would you like to see?'
              }
              className="min-h-[120px] resize-none rounded-xl"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Screenshots (optional)
            </Label>
            
            {/* Image Previews */}
            {imagePreviewUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 5}
              className="w-full gap-2 rounded-xl"
            >
              <ImageIcon className="w-4 h-4" />
              {images.length > 0 ? `Add more (${images.length}/5)` : 'Add screenshots'}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/30 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="rounded-xl gap-2"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
