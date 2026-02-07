import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateConversationTitle } from '@/lib/generateTitle';
import { useAuth } from '@/hooks/useAuth';
import type { Message } from '@/types';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  project_id: string | null;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchConversations = async () => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
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
    }
  };

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
      // Generate a short, meaningful title from first message
      const title = generateConversationTitle(firstMessage);
      
      const insertData: { title: string; user_id: string; project_id?: string } = { 
        title, 
        user_id: user.id 
      };
      
      if (projectId) {
        insertData.project_id = projectId;
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchConversations();
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

      const messages = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content as any, // Database returns JSONB which can be string or object
        timestamp: new Date(msg.created_at).getTime(),
        metadata: (msg.metadata as any) || undefined
      }));

      // Detect and mark interrupted generations:
      // Any assistant message with generationStatus='generating' that is older than 2 minutes
      // is almost certainly interrupted (the API call was lost due to refresh/navigation)
      const TWO_MINUTES_MS = 2 * 60 * 1000;
      const now = Date.now();
      
      for (const msg of messages) {
        if (
          msg.role === 'assistant' && 
          msg.metadata?.generationStatus === 'generating' &&
          (now - msg.timestamp) > TWO_MINUTES_MS
        ) {
          msg.metadata = { 
            ...msg.metadata, 
            generationStatus: 'interrupted' 
          };
          
          // Also update in DB so it stays interrupted
          supabase.from('messages')
            .update({ metadata: msg.metadata })
            .eq('id', msg.id)
            .eq('conversation_id', conversationId)
            .then(() => {
              console.log('[loadConversation] Marked interrupted message:', msg.id);
            });
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
          metadata: message.metadata
        });

      if (error) throw error;

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      await fetchConversations();
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

      await fetchConversations();
      
      toast({
        description: 'Conversation deleted',
      });
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
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle.trim() })
        .eq('id', conversationId);

      if (error) throw error;

      await fetchConversations();
      
      toast({
        description: 'Conversation renamed',
      });
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
      
      toast({
        description: 'Link copied to clipboard',
      });
    } catch (error) {
      console.error('Error sharing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy share link',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set up realtime subscription to automatically refresh when conversations change
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    conversations,
    isLoading,
    createConversation,
    loadConversation,
    saveMessage,
    deleteConversation,
    renameConversation,
    shareConversation,
    refreshConversations: fetchConversations
  };
};
