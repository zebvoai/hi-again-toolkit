import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types';

/**
 * Reloads the current conversation's messages from the database when:
 * 1. The browser tab regains focus (visibilitychange)
 * 2. The current conversation is marked as stale (responses were generated while user was on another conversation)
 */
export const useTabFocusReload = () => {
  const { 
    currentConversationId, 
    isLoading, 
    setMessages, 
    staleConversationIds,
    clearStaleConversation,
  } = useChatStore();
  
  const isReloadingRef = useRef(false);

  const reloadConversation = async (conversationId: string) => {
    if (isReloadingRef.current) return;
    isReloadingRef.current = true;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('[useTabFocusReload] Error reloading conversation:', error);
        return;
      }
      
      // Only update if we're still on the same conversation
      const currentId = useChatStore.getState().currentConversationId;
      if (currentId !== conversationId) return;
      
      const TWO_MINUTES_MS = 2 * 60 * 1000;
      const now = Date.now();
      
      const messages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content as any,
        timestamp: new Date(msg.created_at).getTime(),
        metadata: (msg.metadata as any) || undefined,
      }));
      
      // Mark old generating messages as interrupted
      for (const msg of messages) {
        if (
          msg.role === 'assistant' && 
          msg.metadata?.generationStatus === 'generating' &&
          (now - msg.timestamp) > TWO_MINUTES_MS
        ) {
          msg.metadata = { ...msg.metadata, generationStatus: 'interrupted' };
        }
      }
      
      setMessages(messages);
      clearStaleConversation(conversationId);
      console.log('[useTabFocusReload] Reloaded conversation:', conversationId, 'with', messages.length, 'messages');
    } catch (err) {
      console.error('[useTabFocusReload] Failed to reload:', err);
    } finally {
      isReloadingRef.current = false;
    }
  };

  // Reload when browser tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentConversationId && !useChatStore.getState().isLoading) {
        // Small delay to ensure any pending DB writes have completed
        setTimeout(() => {
          reloadConversation(currentConversationId);
        }, 500);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentConversationId]);

  // Reload when switching to a stale conversation
  useEffect(() => {
    if (currentConversationId && staleConversationIds.has(currentConversationId) && !isLoading) {
      reloadConversation(currentConversationId);
    }
  }, [currentConversationId, staleConversationIds, isLoading]);
};
