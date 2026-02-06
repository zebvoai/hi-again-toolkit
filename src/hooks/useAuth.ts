import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// =============================================================
// TEMPORARY SYNC LOGIC — Cross-app user replication
// After local signup, replicate credentials to other Zebvo apps.
// Remove once unified auth (SSO / shared DB) is implemented.
// =============================================================
const ZEBVO_REPLICA_URLS = [
  'https://monitor.zebvo.ai/functions/v1/replica-signup',
  'https://canvas.zebvo.ai/functions/v1/replica-signup',
];
// NOTE: Canonical path is /internal/auth/replica-signup but Supabase
// edge functions are served at /functions/v1/<name>. All three apps
// must use this same /functions/v1/replica-signup path.

async function replicateSignupToOtherApps(email: string, password: string) {
  try {
    await Promise.allSettled(
      ZEBVO_REPLICA_URLS.map((url) =>
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-zebvo-internal': 'zebvo-auth-sync-v1',
          },
          body: JSON.stringify({ email, password }),
        }).catch(() => {
          // Silently ignore — never block main signup
        })
      )
    );
  } catch {
    // Never throw — this is fire-and-forget
  }
}
// ============= END TEMPORARY SYNC LOGIC =============

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    // TEMPORARY SYNC LOGIC — replicate signup to other Zebvo apps (fire-and-forget)
    if (!error) {
      replicateSignupToOtherApps(email, password);
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
};
