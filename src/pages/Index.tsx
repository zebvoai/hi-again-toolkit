import { useState, useEffect, useRef } from 'react';
import { ModeSelector } from '@/features/modes/components/ModeSelector';
import { ModelSelector } from '@/features/chat/components/ModelSelector';
import { ChevronUp, Paperclip, Send } from 'lucide-react';
import { useChat } from '@/features/chat/hooks/useChat';
import { useModeStore } from '@/features/modes/store/modeStore';
import { Message } from '@/features/chat/components/Message';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';

const Index = () => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-5-2025-08-07');
  const { messages, sendMessage, isLoading, retryMessage } = useChat();
  const { selectedMode } = useModeStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input, selectedModel);
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
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Messages Area - Only show when there are messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 pt-8 pb-40">
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <Message 
                key={message.id} 
                message={message}
                onRetry={() => retryMessage(message.content, selectedModel)}
              />
            ))}
            {isLoading && <TypingIndicator model={selectedModel} />}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      
      {/* Main Content - Show when no messages */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-24">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-3">
              Zebvo AI
            </h1>
            <p className="text-muted-foreground text-base mb-6">
              The World's Greatest AI Platform
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Fixed Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Model Selector */}
          <div className="flex justify-center mb-2">
            <ModelSelector 
              value={selectedModel}
              onChange={setSelectedModel}
            />
          </div>
          
          {/* Chat Input */}
          <form onSubmit={handleSubmit} className="mb-3">
            <div className="relative flex items-center bg-background border border-border rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <button
                type="button"
                className="absolute left-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? 'AI is thinking...' : getPlaceholder()}
                disabled={isLoading}
                className="flex-1 px-12 py-3 bg-transparent outline-none text-sm placeholder:text-muted-foreground disabled:opacity-50"
              />
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          {/* Mode Selector */}
          <div className="flex justify-center mb-2">
            <ModeSelector />
          </div>
          
          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground pb-1">
            Zebvo AI can make mistakes. Check important info.{' '}
            <button className="underline hover:text-foreground transition-colors">
              See Cookie Preferences
            </button>
            .
          </p>
        </div>
      </div>
      
      {/* Scroll to top button */}
      <button 
        className="fixed bottom-6 right-6 p-3.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Index;
