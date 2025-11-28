import { useState, KeyboardEvent } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send } from 'lucide-react';
import { InteractionMode } from '@/types';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  currentMode: InteractionMode;
}

export function ChatInput({ onSend, disabled, currentMode }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder = {
    text: 'Type your message...',
    image: 'Describe the image you want to create or analyze...',
    video: 'Ask about video content...',
    build: 'Describe what you want to build...',
  }[currentMode];

  return (
    <div className="flex gap-2">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[80px] resize-none"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        size="icon"
        className="h-[80px] w-[80px]"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
