import { useState } from 'react';
import type { Message as MessageType } from '@/types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface MessageProps {
  message: MessageType;
  onRetry?: () => void;
}

export const Message = ({ message, onRetry }: MessageProps) => {
  const isUser = message.role === 'user';
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group animate-fade-in`}>
      {/* Avatar for AI */}
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg mr-3 flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div
        className={`
          max-w-[70%] rounded-2xl px-6 py-4 shadow-xl relative
          ${isUser 
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
            : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 text-foreground'
          }
        `}
      >
        {/* Model badge for AI messages */}
        {!isUser && message.metadata?.model && (
          <Badge 
            variant="secondary" 
            className="mb-3 text-xs font-medium bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0"
          >
            {message.metadata.model}
          </Badge>
        )}
        
        {message.metadata?.imageUrl ? (
          <div className="space-y-3">
            <img 
              src={message.metadata.imageUrl} 
              alt="Generated" 
              className="rounded-xl w-full max-w-md shadow-lg"
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
                    <div className="relative group/code my-4 rounded-xl overflow-hidden shadow-lg">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm hover:bg-white/20"
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
                    <code className="bg-white/30 dark:bg-gray-800/30 px-2 py-1 rounded text-sm backdrop-blur-sm" {...props}>
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
        
        {/* Copy button for AI messages */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 dark:border-gray-700/20">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-xs hover:bg-white/20 dark:hover:bg-gray-800/20 backdrop-blur-sm"
              onClick={copyMessage}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1.5" />
                  Copy
                </>
              )}
            </Button>
            
            {message.metadata?.error && onRetry && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs bg-white/10 backdrop-blur-sm hover:bg-white/20"
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Avatar for User */}
      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg ml-3 flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};
