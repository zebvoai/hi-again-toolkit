import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateConversationTitle } from '@/lib/generateTitle';
import { useAuth } from '@/hooks/useAuth';
import { evictFromCache } from '../store/chatStore';
import type { Message } from '@/types';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  project_id: string | null;
}

// ── Debounce helper ──────────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 600;

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const isFetchingRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // Only fetch metadata columns — no message content
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at, project_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, toast]);

  /** Debounced version — prevents rapid-fire refreshes from realtime events */
  const debouncedFetch = useCallback(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fetchConversations();
    }, DEBOUNCE_MS);
  }, [fetchConversations]);

  const createConversation = async (firstMessage: string, projectId?: string | null): Promise<string | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a conversation',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const title = generateConversationTitle(firstMessage);

      const insertData: { title: string; user_id: string; project_id?: string } = {
        title,
        user_id: user.id,
      };

      if (projectId) {
        insertData.project_id = projectId;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert(insertData)
        .select('id, title, created_at, updated_at, project_id')
        .single();

      if (error) throw error;

      // Optimistically prepend the new conversation
      setConversations(prev => [data, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
      return null;
    }
  };

  const loadConversation = async (conversationId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content as any,
        timestamp: new Date(msg.created_at).getTime(),
        metadata: (msg.metadata as any) || undefined,
      }));

      // Detect and mark interrupted generations
      const TWO_MINUTES_MS = 2 * 60 * 1000;
      const now = Date.now();

      for (const msg of messages) {
        if (
          msg.role === 'assistant' &&
          msg.metadata?.generationStatus === 'generating' &&
          now - msg.timestamp > TWO_MINUTES_MS
        ) {
          msg.metadata = { ...msg.metadata, generationStatus: 'interrupted' };

          // Fire-and-forget DB update
          supabase.from('messages')
            .update({ metadata: msg.metadata })
            .eq('id', msg.id)
            .eq('conversation_id', conversationId)
            .then(() => {});
        }
      }

      return messages;
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation',
        variant: 'destructive',
      });
      return [];
    }
  };

  const saveMessage = async (conversationId: string, message: Message) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          metadata: message.metadata,
        });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Debounced refresh instead of immediate
      debouncedFetch();
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      // Evict from LRU cache
      evictFromCache(conversationId);

      // Optimistic removal from list
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      toast({ description: 'Conversation deleted' });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
    }
  };

  const renameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const trimmed = newTitle.trim();
      const { error } = await supabase
        .from('conversations')
        .update({ title: trimmed })
        .eq('id', conversationId);

      if (error) throw error;

      // Optimistic local update
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, title: trimmed } : c)
      );

      toast({ description: 'Conversation renamed' });
    } catch (error) {
      console.error('Error renaming conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename conversation',
        variant: 'destructive',
      });
    }
  };

  const shareConversation = async (conversationId: string) => {
    try {
      const shareUrl = `${window.location.origin}/chat/${conversationId}`;
      await navigator.clipboard.writeText(shareUrl);

      toast({ description: 'Link copied to clipboard' });
    } catch (error) {
      console.error('Error sharing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy share link',
        variant: 'destructive',
      });
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription — debounced to prevent rapid re-fetches
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [user, debouncedFetch]);

  const deleteAllConversations = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete conversations',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Clear all from local state
      setConversations([]);

      // Evict all from cache
      conversations.forEach(conv => evictFromCache(conv.id));

      toast({ description: 'All conversations deleted' });
    } catch (error) {
      console.error('Error deleting all conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete all conversations',
        variant: 'destructive',
      });
    }
  };

  return {
    conversations,
    isLoading,
    createConversation,
    loadConversation,
    saveMessage,
    deleteConversation,
    deleteAllConversations,
    renameConversation,
    shareConversation,
    refreshConversations: fetchConversations,
  };
};
