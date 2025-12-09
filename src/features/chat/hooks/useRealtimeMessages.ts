import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChatStore } from '../store/chatStore';
import type { Message } from '@/types';

export const useRealtimeMessages = () => {
  const { currentConversationId, messages, setMessages, addMessage, updateMessage, deleteMessage } = useChatStore();

  useEffect(() => {
    if (!currentConversationId) return;

    console.log('Setting up realtime messages subscription for:', currentConversationId);

    const channel = supabase
      .channel(`messages-${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          console.log('Realtime message INSERT:', payload);
          const newMsg = payload.new as any;
          
          // Check if message already exists locally (we may have added it ourselves)
          const existingMessage = messages.find(m => m.id === newMsg.id);
          if (existingMessage) return;
          
          const message: Message = {
            id: newMsg.id,
            role: newMsg.role as 'user' | 'assistant',
            content: newMsg.content,
            timestamp: new Date(newMsg.created_at).getTime(),
            metadata: newMsg.metadata || undefined
          };
          
          addMessage(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          console.log('Realtime message UPDATE:', payload);
          const updatedMsg = payload.new as any;
          
          updateMessage(updatedMsg.id, {
            content: updatedMsg.content,
            metadata: updatedMsg.metadata || undefined
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`
        },
        (payload) => {
          console.log('Realtime message DELETE:', payload);
          const deletedMsg = payload.old as any;
          deleteMessage(deletedMsg.id);
        }
      )
      .subscribe((status) => {
        console.log('Realtime messages subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime messages subscription');
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);
};
