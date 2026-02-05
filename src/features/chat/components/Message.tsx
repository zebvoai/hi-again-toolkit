import { useState } from 'react';
import type { Message as MessageType, MultiModelContent } from '@/types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, RefreshCw, Pencil, X, Save, Download } from 'lucide-react';
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
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const exportMessage = () => {
    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content, null, 2);
    const modelName = message.metadata?.model ? formatModelName(message.metadata.model) : 'AI';
    const timestamp = message.timestamp ? new Date(message.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    const markdown = `# ${modelName} Response\n\n**Date:** ${timestamp}\n\n---\n\n${content}`;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Research exported');
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

  // Handle multi-model responses - render full width
  if (isMultiModel) {
    const multiContent = message.content as MultiModelContent;
    const models = message.metadata?.models || Object.keys(multiContent);
    const isImageMode = message.metadata?.isImage;

    if (isImageMode) {
      // Image multi-model - render full width like text multi-model
      return (
        <div className="w-full">
          <MultiModelImageResponse content={multiContent} models={models} />
        </div>
      );
    }
    
    // Text multi-model - render without wrapper for full width
    return <MultiModelResponse content={multiContent} models={models} />;
  }

  // Get content as string for user and single AI messages
  const contentString = typeof message.content === 'string' ? message.content : '';
  const isShortMessage = contentString.length < 50;
  const isVeryShortMessage = contentString.length < 20;
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} appear-smooth`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} ${isUser ? 'max-w-[70%]' : 'max-w-[75%]'} gap-2.5`}>
        {/* Avatar for AI only */}
        {!isUser && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/35 flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5 transition-transform duration-normal ease-spring hover:scale-110">
            <span className="text-primary font-semibold text-[10px]">Z</span>
          </div>
        )}
        
        <div className="flex flex-col group min-w-0">
          {/* Model name and timestamp for AI messages */}
          {!isUser && (
            <div className="flex items-center gap-1.5 mb-1 ml-0.5">
              {message.metadata?.model && (
                <span className="text-[10px] font-medium text-muted-foreground/70">
                  {formatModelName(message.metadata.model)}
                </span>
              )}
              {timeAgo && (
                <span className="text-[9px] text-muted-foreground/40">
                  {timeAgo}
                </span>
              )}
            </div>
          )}
          
          {/* Message bubble */}
          <div className={`shadow-sm transition-all duration-normal ease-spring hover:shadow-md ${
            isUser 
              ? `rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ${isVeryShortMessage ? 'px-3 py-1.5' : isShortMessage ? 'px-3.5 py-2' : 'px-4 py-2.5'}`
              : 'rounded-2xl rounded-bl-md bg-card border border-border/30 text-foreground px-4 py-3'
          }`}>
            {isUser ? (
              isEditing ? (
                <div className="space-y-2.5">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[60px] bg-white/10 rounded-lg p-2 text-[15px] leading-[1.5] resize-none outline-none focus:ring-2 focus:ring-white/30"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/10 hover:bg-white/20 transition-all duration-fast ease-gentle active:scale-press"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-white/20 hover:bg-white/30 transition-all duration-fast ease-gentle active:scale-press"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Image previews for attachments */}
                  {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
                    <div className={`flex flex-wrap gap-1.5 ${message.metadata.attachments.length === 1 ? '' : 'max-w-[280px]'}`}>
                      {message.metadata.attachments.map((url, idx) => (
                        <div 
                          key={idx} 
                          className={`relative rounded-lg overflow-hidden ${
                            message.metadata?.attachments?.length === 1 
                              ? 'w-full max-w-[200px]' 
                              : 'w-16 h-16'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Attachment ${idx + 1}`}
                            className={`object-cover ${
                              message.metadata?.attachments?.length === 1 
                                ? 'w-full h-auto max-h-[150px]' 
                                : 'w-full h-full'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {contentString && (
                    <p className="text-[15px] leading-[1.5] whitespace-pre-wrap break-words">
                      {contentString}
                    </p>
                  )}
                </div>
              )
            ) : (
              <div className="text-[15px] leading-[1.75] text-foreground/90">
                <ReactMarkdown
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
                      if (!inline && match) {
                        return (
                          <div className="relative group my-5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
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
                              className="rounded-xl !my-0 !text-[13px] !leading-relaxed"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      return (
                        <code className="bg-muted/50 px-1.5 py-0.5 rounded text-[13px] font-mono text-foreground/85" {...props}>
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => <p className="mb-3.5 last:mb-0 leading-[1.75]">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-3.5 space-y-1.5 marker:text-muted-foreground/60">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-3.5 space-y-1.5 marker:text-muted-foreground/60">{children}</ol>,
                    li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-foreground/85">{children}</em>,
                    h1: ({ children }) => <h1 className="text-xl font-semibold text-foreground mb-3 mt-6 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mb-2.5 mt-5 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-medium text-foreground mb-2 mt-4 first:mt-0">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-[15px] font-medium text-foreground mb-1.5 mt-3 first:mt-0">{children}</h4>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-muted-foreground/30 pl-4 my-4 text-muted-foreground">{children}</blockquote>,
                    hr: () => <hr className="my-5 border-border/40" />,
                    a: ({ children, href }) => <a href={href} className="text-primary hover:underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
                  }}
                >
                  {contentString}
                </ReactMarkdown>
              </div>
            )}
          </div>
          
          {/* Actions row */}
          <div className={`flex items-center gap-1 mt-1.5 ${isUser ? 'justify-end' : 'ml-0.5'} opacity-0 group-hover:opacity-100 transition-opacity duration-fast ease-gentle`}>
            {/* User message: timestamp + edit */}
            {isUser && !isEditing && (
              <>
                {timeAgo && (
                  <span className="text-[10px] text-muted-foreground/50 mr-1">
                    {timeAgo}
                  </span>
                )}
                <button
                  onClick={handleStartEdit}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/60 hover:bg-accent/60 hover:text-foreground transition-all duration-fast ease-gentle active:scale-press"
                  title="Edit message"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </>
            )}
            
            {/* AI message actions */}
            {!isUser && (
              <>
                <button
                  onClick={copyMessage}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all duration-fast ease-gentle active:scale-press"
                  title={copied ? 'Copied!' : 'Copy'}
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all duration-slow ease-gentle active:scale-press hover:rotate-180"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                
                <button
                  onClick={exportMessage}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all duration-fast ease-gentle active:scale-press"
                  title="Export"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                
                {message.metadata?.error && onRetry && (
                  <button
                    onClick={onRetry}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all duration-fast ease-gentle active:scale-press"
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