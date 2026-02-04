import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Cast to include new columns
      setProfile(data as unknown as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: { username?: string; avatar_url?: string }) => {
    if (!user?.id) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile
      await fetchProfile();
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) return { url: null, error: new Error('Not authenticated') };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      await updateProfile({ avatar_url: publicUrl });

      return { url: publicUrl, error: null };
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload avatar',
        variant: 'destructive',
      });
      return { url: null, error };
    }
  };

  return {
    profile,
    isLoading,
    updateProfile,
    uploadAvatar,
    refetchProfile: fetchProfile,
  };
};
