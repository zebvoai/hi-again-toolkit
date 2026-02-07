import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChatStore } from '../store/chatStore';
import type { Message } from '@/types';

export const useRealtimeMessages = () => {
  // Use stable refs to avoid re-subscribing on every render
  const conversationIdRef = useRef<string | null>(null);

  // Keep conversationIdRef in sync
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  conversationIdRef.current = currentConversationId;

  // Stable callbacks via refs
  const updateMessageRef = useRef(useChatStore.getState().updateMessage);
  const deleteMessageRef = useRef(useChatStore.getState().deleteMessage);
  useEffect(() => {
    updateMessageRef.current = useChatStore.getState().updateMessage;
    deleteMessageRef.current = useChatStore.getState().deleteMessage;
  });

  useEffect(() => {
    if (!currentConversationId) return;

    const channel = supabase
      .channel(`messages-${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          const state = useChatStore.getState();

          // Only process if we're still on the same conversation
          if (state.currentConversationId !== currentConversationId) return;

          // Skip if already exists
          if (state.messages.some(m => m.id === newMsg.id)) return;

          // Skip generating placeholders (managed locally by useChat)
          if (newMsg.metadata?.generationStatus === 'generating') return;

          // Deduplicate recent messages by content
          const messageTime = new Date(newMsg.created_at).getTime();
          if (Math.abs(Date.now() - messageTime) < 5000) {
            const contentStr = typeof newMsg.content === 'string'
              ? newMsg.content
              : JSON.stringify(newMsg.content);

            const hasSimilar = state.messages.some(m => {
              const local = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
              return m.role === newMsg.role && local === contentStr;
            });
            if (hasSimilar) return;
          }

          const message: Message = {
            id: newMsg.id,
            role: newMsg.role as 'user' | 'assistant',
            content: newMsg.content,
            timestamp: messageTime,
            metadata: newMsg.metadata || undefined,
          };

          state.setMessages([...state.messages, message]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          const state = useChatStore.getState();
          if (state.currentConversationId !== currentConversationId) return;
          if (state.messages.some(m => m.id === updatedMsg.id)) {
            updateMessageRef.current(updatedMsg.id, {
              content: updatedMsg.content,
              metadata: updatedMsg.metadata || undefined,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        (payload) => {
          const deletedMsg = payload.old as any;
          deleteMessageRef.current(deletedMsg.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);
};
