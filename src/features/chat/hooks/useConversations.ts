import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/types';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
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

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    try {
      // Create title from first message (max 50 chars)
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title })
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

      return data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content as any, // Database returns JSONB which can be string or object
        timestamp: new Date(msg.created_at).getTime(),
        metadata: (msg.metadata as any) || undefined
      }));
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

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    isLoading,
    createConversation,
    loadConversation,
    saveMessage,
    deleteConversation,
    refreshConversations: fetchConversations
  };
};
