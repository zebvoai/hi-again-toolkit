import { useState } from 'react';
import type { Message as MessageType, MultiModelContent } from '@/types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { MultiModelResponse } from './MultiModelResponse';

interface MessageProps {
  message: MessageType;
  onRetry?: () => void;
}

export const Message = ({ message, onRetry }: MessageProps) => {
  const isUser = message.role === 'user';
  const isMultiModel = !isUser && typeof message.content === 'object' && !Array.isArray(message.content);
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
    const textToCopy = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle multi-model responses
  if (isMultiModel) {
    const multiContent = message.content as MultiModelContent;
    const models = message.metadata?.models || Object.keys(multiContent);
    
    return (
      <div className="flex justify-start mb-6 group animate-fade-in">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md mr-3 flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 max-w-4xl">
          <MultiModelResponse content={multiContent} models={models} />
        </div>
      </div>
    );
  }

  // Get content as string for user and single AI messages
  const contentString = typeof message.content === 'string' ? message.content : '';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group animate-fade-in`}>
      {/* Avatar for AI */}
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md mr-3 flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div
        className={`
          max-w-[70%] rounded-2xl px-5 py-3.5 shadow-sm relative
          ${isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-white border border-gray-200 text-foreground'
          }
        `}
      >
        {/* Model badge for AI messages */}
        {!isUser && message.metadata?.model && (
          <Badge 
            variant="secondary" 
            className="mb-2.5 text-xs font-medium bg-gray-100 text-gray-700 border-0"
          >
            {message.metadata.model}
          </Badge>
        )}
        
        {message.metadata?.imageUrl ? (
          <div className="space-y-3">
            <img 
              src={message.metadata.imageUrl} 
              alt="Generated" 
              className="rounded-xl w-full max-w-md shadow-md"
            />
            {contentString && (
              <p className="text-sm leading-relaxed">{contentString}</p>
            )}
          </div>
        ) : isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {contentString}
          </p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const codeId = `code-${message.id}-${Math.random()}`;
                  
                  return !inline && match ? (
                    <div className="relative group/code my-3 rounded-lg overflow-hidden shadow-md">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity bg-gray-800/80 hover:bg-gray-700"
                        onClick={() => copyToClipboard(codeString, codeId)}
                      >
                        {copiedCode === codeId ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <Copy className="w-4 h-4 text-white" />
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
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {contentString}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Copy button for AI messages */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-100">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2.5 text-xs hover:bg-gray-100"
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
                className="h-7 px-2.5 text-xs"
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
        <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center shadow-md ml-3 flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};
