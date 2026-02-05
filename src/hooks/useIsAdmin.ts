import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Call the is_admin() database function
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        console.error('Failed to check admin status:', err);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return { isAdmin, isLoading };
}
