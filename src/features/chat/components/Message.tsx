import { useState } from 'react';
import type { Message as MessageType } from '@/types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MessageProps {
  message: MessageType;
  onRetry?: () => void;
}

export const Message = ({ message, onRetry }: MessageProps) => {
  const isUser = message.role === 'user';
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard',
    });
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div
        className={`
          max-w-[75%] rounded-2xl px-5 py-4 shadow-sm relative
          ${isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-card text-card-foreground border border-border'
          }
        `}
      >
        {message.metadata?.imageUrl ? (
          <div className="space-y-3">
            <img 
              src={message.metadata.imageUrl} 
              alt="Generated" 
              className="rounded-lg w-full max-w-md"
            />
            {message.content && (
              <p className="text-sm leading-relaxed">{message.content}</p>
            )}
          </div>
        ) : isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const codeId = `code-${message.id}-${Math.random()}`;
                  
                  return !inline && match ? (
                    <div className="relative group/code">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(codeString, codeId)}
                      >
                        {copiedCode === codeId ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        
        {!isUser && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
            <p className="text-xs opacity-60">
              {message.metadata?.model || 'AI'}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={copyMessage}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
        )}
        
        {message.metadata?.error && onRetry && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};
