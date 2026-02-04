import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserImage {
  id: string;
  url: string;
  thumbnail_url: string | null;
  source_type: 'uploaded' | 'generated';
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  prompt: string | null;
  model: string | null;
  conversation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useUserImages = () => {
  const [images, setImages] = useState<UserImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchImages = async () => {
    if (!user) {
      setImages([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages((data as UserImage[]) || []);
    } catch (error) {
      console.error('Error fetching user images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const addImage = async (imageData: {
    url: string;
    thumbnail_url?: string;
    source_type: 'uploaded' | 'generated';
    filename?: string;
    mime_type?: string;
    size_bytes?: number;
    prompt?: string;
    model?: string;
    conversation_id?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (!user) return null;

    try {
      const insertData = {
        user_id: user.id,
        url: imageData.url,
        thumbnail_url: imageData.thumbnail_url || null,
        source_type: imageData.source_type,
        filename: imageData.filename || null,
        mime_type: imageData.mime_type || null,
        size_bytes: imageData.size_bytes || null,
        prompt: imageData.prompt || null,
        model: imageData.model || null,
        conversation_id: imageData.conversation_id || null,
        metadata: imageData.metadata || {},
      };

      const { data, error } = await supabase
        .from('user_images')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      
      await fetchImages();
      return data as UserImage;
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error('Failed to save image');
      return null;
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('user_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      
      await fetchImages();
      toast.success('Image deleted');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  useEffect(() => {
    fetchImages();
  }, [user]);

  return {
    images,
    isLoading,
    addImage,
    deleteImage,
    refreshImages: fetchImages,
  };
};
