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
import { MultiModelImageResponse } from './MultiModelImageResponse';
import { formatModelName } from '@/lib/utils';

interface MessageProps {
  message: MessageType;
  onRetry?: () => void;
  allMessages?: MessageType[];
}

export const Message = ({ message, onRetry, allMessages = [] }: MessageProps) => {
  const isUser = message.role === 'user';
  const isMultiModel = !isUser && typeof message.content === 'object' && !Array.isArray(message.content);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Find the preceding user message for multi-model responses
  const getUserQuestion = (): string => {
    if (!isMultiModel) return '';
    const currentIndex = allMessages.findIndex(msg => msg.id === message.id);
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (allMessages[i].role === 'user' && typeof allMessages[i].content === 'string') {
        return allMessages[i].content as string;
      }
    }
    return '';
  };
  
  const userQuestion = getUserQuestion();
  
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
    const isImageMode = message.metadata?.isImage;
    
    // If it's multi-model image generation
    if (isImageMode) {
      return (
        <div className="flex justify-start mb-4 animate-fade-in">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.08)] mr-2 flex-shrink-0">
            <span className="text-blue-700 font-semibold text-sm">Z</span>
          </div>
          <div className="flex-1 max-w-[75%]">
            <MultiModelImageResponse content={multiContent} models={models} />
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full">
        <MultiModelResponse 
          content={multiContent} 
          models={models} 
          userQuestion={userQuestion}
        />
      </div>
    );
  }

  // Get content as string for user and single AI messages
  const contentString = typeof message.content === 'string' ? message.content : '';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className={`flex ${isUser ? 'flex-row-reverse ml-auto' : 'flex-row'} max-w-[75%] gap-2`}>
        {/* Avatar for AI only */}
        {!isUser && (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.08)] flex-shrink-0">
            <span className="text-blue-700 font-semibold text-sm">Z</span>
          </div>
        )}
        
        <div className="flex flex-col">
          {/* Model name for AI messages */}
          {!isUser && message.metadata?.model && (
            <span className="text-[11px] font-medium text-gray-400 mb-1 ml-0.5">
              {formatModelName(message.metadata.model)}
            </span>
          )}
          
          {/* Message bubble */}
          <div
            className={`
              px-4 py-3 shadow-sm transition-all duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.005] hover:shadow-md
              ${isUser 
                ? 'rounded-[18px_18px_4px_18px] bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-[0_4px_12px_hsl(var(--primary)/0.2)]' 
                : 'rounded-[18px_18px_18px_4px] bg-muted text-foreground hover:bg-muted/90'
              }
            `}
          >
            {message.metadata?.imageUrl ? (
              <div className="space-y-3">
                <img 
                  src={message.metadata.imageUrl} 
                  alt="Generated" 
                  className="rounded-xl w-full max-w-md shadow-md"
                />
                {contentString && (
                  <p className="text-[15px] leading-[1.5]">{contentString}</p>
                )}
              </div>
            ) : message.metadata?.videoUrl ? (
              <div className="space-y-3">
                <video 
                  src={message.metadata.videoUrl} 
                  controls
                  className="rounded-xl w-full max-w-md shadow-md"
                />
                {contentString && (
                  <p className="text-[15px] leading-[1.5]">{contentString}</p>
                )}
              </div>
            ) : isUser ? (
              <p className="text-[15px] leading-[1.5] whitespace-pre-wrap break-words">
                {contentString}
              </p>
            ) : (
              <div className="prose prose-sm max-w-none [&>*]:text-[#1A1A1A]">
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
                        <code className="bg-gray-200/60 px-1.5 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                    a({ node, children, ...props }: any) {
                      return (
                        <a className="text-[#007AFF] hover:underline" {...props}>
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {contentString}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Actions row for AI messages */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-2 ml-0.5">
              <button
                onClick={copyMessage}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-all duration-[180ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.95]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              {message.metadata?.error && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-all duration-[180ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-[0.95]"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
