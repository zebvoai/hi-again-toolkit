import { useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { useModeStore } from '@/features/modes/store/modeStore';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const { selectedMode } = useModeStore();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };
  
  const getPlaceholder = () => {
    switch (selectedMode) {
      case 'image':
        return 'Describe the image you want to generate...';
      case 'video':
        return 'Describe the video you want to create...';
      case 'build':
        return 'Describe what you want to build...';
      default:
        return 'Ask anything...';
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative flex items-center bg-background border border-border rounded-full shadow-lg">
        <button
          type="button"
          className="absolute left-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={isLoading}
          className="flex-1 px-14 py-4 bg-transparent outline-none text-sm placeholder:text-muted-foreground disabled:opacity-50"
        />
        
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-3 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};
