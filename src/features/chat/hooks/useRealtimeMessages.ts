import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChatStore } from '../store/chatStore';
import type { Message } from '@/types';

export const useRealtimeMessages = () => {
  const { currentConversationId, messages, setMessages, updateMessage, deleteMessage } = useChatStore();
  
  // Track message IDs we've recently added locally to prevent realtime duplicates
  const recentLocalMessagesRef = useRef<Set<string>>(new Set());
  const lastMessageTimestampRef = useRef<number>(0);

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
          const currentMessages = useChatStore.getState().messages;
          
          // Skip if message with this ID already exists
          if (currentMessages.some(m => m.id === newMsg.id)) {
            console.log('Skipping duplicate by ID:', newMsg.id);
            return;
          }
          
          // Skip if we recently added a message with similar content and role
          // This catches the case where local messages have different IDs than DB
          const messageTime = new Date(newMsg.created_at).getTime();
          const timeDiff = Math.abs(Date.now() - messageTime);
          
          // If message was created within last 5 seconds, check for content match
          if (timeDiff < 5000) {
            const contentStr = typeof newMsg.content === 'string' 
              ? newMsg.content 
              : JSON.stringify(newMsg.content);
            
            const hasSimilarMessage = currentMessages.some(m => {
              const localContent = typeof m.content === 'string' 
                ? m.content 
                : JSON.stringify(m.content);
              return m.role === newMsg.role && localContent === contentStr;
            });
            
            if (hasSimilarMessage) {
              console.log('Skipping duplicate by content match');
              return;
            }
          }
          
          // This is a genuinely new message from another tab/session
          const message: Message = {
            id: newMsg.id,
            role: newMsg.role as 'user' | 'assistant',
            content: newMsg.content,
            timestamp: messageTime,
            metadata: newMsg.metadata || undefined
          };
          
          // Add to messages
          const updatedMessages = [...currentMessages, message];
          useChatStore.getState().setMessages(updatedMessages);
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
          const currentMessages = useChatStore.getState().messages;
          
          // Only update if message exists locally
          const existingMessage = currentMessages.find(m => m.id === updatedMsg.id);
          if (existingMessage) {
            updateMessage(updatedMsg.id, {
              content: updatedMsg.content,
              metadata: updatedMsg.metadata || undefined
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
  }, [currentConversationId, updateMessage, deleteMessage]);
};