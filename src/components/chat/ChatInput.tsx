import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Mic, Volume2, Paperclip, Send } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useChatActions } from '@/hooks/useChat';
import { validateMessage, estimateTokenCount } from '@/utils/validators';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function ChatInput() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isStreaming, currentMode } = useChat();
  const { sendMessage, generateImage } = useChatActions();
  const { toast } = useToast();

  const tokenCount = estimateTokenCount(input);
  const maxChars = 4000;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async () => {
    const validation = validateMessage(input);
    
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Invalid message',
        description: validation.error,
      });
      return;
    }

    const message = input.trim();
    setInput('');

    if (currentMode === 'image') {
      await generateImage(message);
    } else {
      await sendMessage(message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          'flex items-end gap-3 rounded-3xl border bg-card px-4 py-3 shadow-sm transition-all',
          isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-border'
        )}
      >
        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-accent transition-colors"
          aria-label="Expand options"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Ask anything..."
          disabled={isStreaming}
          className="flex-1 resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          rows={1}
          maxLength={maxChars}
          style={{ maxHeight: '200px' }}
        />

        <div className="flex shrink-0 items-center gap-2">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent transition-colors"
            aria-label="Voice input"
          >
            <Mic className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent transition-colors"
            aria-label="Text to speech"
          >
            <Volume2 className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between px-4 text-xs text-muted-foreground">
        <span>~{tokenCount} tokens · 1 model</span>
        <span>{input.length}/{maxChars}</span>
      </div>
    </div>
  );
}
