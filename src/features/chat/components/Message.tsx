import { useState } from 'react';
import type { Message as MessageType, MultiModelContent } from '@/types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, RefreshCw, Pencil, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MultiModelResponse } from './MultiModelResponse';
import { MultiModelImageResponse } from './MultiModelImageResponse';
import { formatModelName } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MessageProps {
  message: MessageType;
  onRetry?: () => void;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
}

export const Message = ({
  message,
  onRetry,
  onRegenerate,
  onEdit,
}: MessageProps) => {
  const isUser = message.role === 'user';
  const isMultiModel = !isUser && typeof message.content === 'object' && !Array.isArray(message.content);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Format timestamp
  const timeAgo = message.timestamp 
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : null;
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  const copyMessage = () => {
    const textToCopy = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    if (typeof message.content === 'string') {
      setEditContent(message.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  // Handle multi-model responses
  if (isMultiModel) {
    const multiContent = message.content as MultiModelContent;
    const models = message.metadata?.models || Object.keys(multiContent);
    const isImageMode = message.metadata?.isImage;

    if (isImageMode) {
      return (
        <div className="flex justify-start mb-4 animate-message-in-left">
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
        <MultiModelResponse content={multiContent} models={models} />
      </div>
    );
  }

  // Get content as string for user and single AI messages
  const contentString = typeof message.content === 'string' ? message.content : '';
  
  // Calculate dynamic sizing for user messages
  const isShortMessage = contentString.length < 50;
  const isVeryShortMessage = contentString.length < 20;
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isUser ? 'animate-message-in-right' : 'animate-message-in-left'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isUser ? 'max-w-[65%]' : 'max-w-[75%]'} gap-2`}>
        {/* Avatar for AI only */}
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/30 flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
            <span className="text-primary font-semibold text-[10px]">Z</span>
          </div>
        )}
        
        <div className="flex flex-col group">
          {/* Model name and timestamp for AI messages */}
          {!isUser && (
            <div className="flex items-center gap-1.5 mb-1 ml-0.5">
              {message.metadata?.model && (
                <span className="text-[10px] font-medium text-muted-foreground/60">
                  {formatModelName(message.metadata.model)}
                </span>
              )}
              {timeAgo && (
                <span className="text-[9px] text-muted-foreground/35">
                  {timeAgo}
                </span>
              )}
            </div>
          )}
          
          {/* Message bubble - dynamic sizing */}
          <div className={`shadow-sm transition-all duration-200 ${
            isUser 
              ? `rounded-[14px] rounded-br-[4px] bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ${isVeryShortMessage ? 'px-3 py-1.5' : isShortMessage ? 'px-3.5 py-2' : 'px-4 py-2.5'}`
              : 'rounded-[14px] rounded-bl-[4px] bg-card border border-border/30 text-foreground px-3.5 py-2.5'
          }`}>
            {isUser ? (
              isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[60px] bg-white/10 rounded-lg p-2 text-[15px] leading-[1.5] resize-none outline-none focus:ring-2 focus:ring-white/30"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save & Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[15px] leading-[1.5] whitespace-pre-wrap break-words">
                  {contentString}
                </p>
              )
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
                      if (!inline && match) {
                        return (
                          <div className="relative group my-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 h-7 w-7 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                              onClick={() => copyToClipboard(String(children), codeId)}
                            >
                              {copiedCode === codeId ? (
                                <Check className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg !my-0"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      return (
                        <code className="bg-muted/50 dark:bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1.5">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-2 first:mt-0">{children}</h3>,
                  }}
                >
                  {contentString}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Actions row - consolidated with timestamp for user messages */}
          <div className={`flex items-center gap-1.5 mt-1.5 ${isUser ? 'justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200' : 'ml-0.5'}`}>
            {/* User message: timestamp + edit inline */}
            {isUser && !isEditing && (
              <>
                {timeAgo && (
                  <span className="text-[10px] text-muted-foreground/40 mr-1">
                    {timeAgo}
                  </span>
                )}
                <button
                  onClick={handleStartEdit}
                  className="w-6 h-6 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-md flex items-center justify-center text-muted-foreground/60 hover:bg-accent/60 hover:text-foreground transition-all duration-150"
                  title="Edit message"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            )}
            
            {/* AI message actions - icon only with tooltips */}
            {!isUser && (
              <>
                <button
                  onClick={copyMessage}
                  className="w-7 h-7 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all duration-150"
                  title={copied ? 'Copied!' : 'Copy'}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="w-7 h-7 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all duration-150"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                
                {message.metadata?.error && onRetry && (
                  <button
                    onClick={onRetry}
                    className="w-7 h-7 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all duration-150"
                    title="Retry"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
