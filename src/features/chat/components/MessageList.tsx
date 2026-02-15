import { memo, useCallback } from 'react';
import { Message } from '@/features/chat/components/Message';
import type { Message as MessageType } from '@/types';

interface MessageListProps {
  messages: MessageType[];
  onRetry: (content: string) => void;
  onRegenerate: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
}

/**
 * Memoized message list — only re-renders when `messages` array identity changes.
 * Prevents cascading re-renders from unrelated state (input typing, model selection, etc.)
 */
export const MessageList = memo(({ messages, onRetry, onRegenerate, onEdit }: MessageListProps) => {
  return (
    <>
      {messages.map((message, index) => {
        const isMultiModelResponse =
          message.role === 'assistant' &&
          typeof message.content === 'object' &&
          !Array.isArray(message.content) &&
          message.metadata?.models?.length > 1;

        const prevMessage = messages[index - 1];
        const prevIsMultiModel =
          prevMessage?.role === 'assistant' &&
          typeof prevMessage.content === 'object' &&
          !Array.isArray(prevMessage.content) &&
          prevMessage.metadata?.models?.length > 1;

        // Skip duplicate multi-model responses
        if (isMultiModelResponse && prevIsMultiModel) {
          const normalizeModels = (arr: string[] = []) => [...arr].sort().join('|');
          const normalizeContent = (c: unknown) => {
            if (!c || typeof c !== 'object' || Array.isArray(c)) return JSON.stringify(c);
            return JSON.stringify(Object.entries(c as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
          };
          const currModels = message.metadata?.models || [];
          const prevModels = prevMessage!.metadata?.models || [];
          if (
            normalizeModels(currModels) === normalizeModels(prevModels) &&
            normalizeContent(message.content) === normalizeContent(prevMessage!.content)
          ) {
            return null;
          }
        }

        // Multi-model responses handle their own padding for full-width layouts
        const isThisMultiModel =
          message.role === 'assistant' &&
          typeof message.content === 'object' &&
          !Array.isArray(message.content) &&
          message.metadata?.models?.length > 1;

        return (
          <div
            key={message.id}
            className={`w-full ${isThisMultiModel ? '' : 'px-4 sm:px-6 lg:px-8'} ${index === 0 ? 'mt-4' : ''}`}
          >
            <Message
              message={message}
              onRetry={() => onRetry(typeof message.content === 'string' ? message.content : '')}
              onRegenerate={() => onRegenerate(message.id)}
              onEdit={(newContent) => onEdit(message.id, newContent)}
            />
          </div>
        );
      })}
    </>
  );
});

MessageList.displayName = 'MessageList';
