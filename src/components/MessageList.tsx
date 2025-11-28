import { useEffect, useRef } from 'react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm mt-2">Start a conversation by typing below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}
            
            <div
              className={cn(
                'rounded-lg px-4 py-2 max-w-[80%]',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    code: ({ children }) => (
                      <code className="bg-background/50 px-1 py-0.5 rounded text-sm">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5" />
              </div>
            )}
          </div>
        ))}
        
        {isStreaming && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
