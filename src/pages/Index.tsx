import { Chat } from '@/features/chat/components/Chat';
import { ModeSelector } from '@/features/modes/components/ModeSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronUp } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-8">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-4">
            Zebvo AI
          </h1>
          <p className="text-muted-foreground text-lg">
            The World's Greatest AI Platform
          </p>
          <div className="flex items-center justify-center gap-1 mt-6">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150" />
          </div>
        </div>
        
        {/* Model Selector */}
        <div className="w-full max-w-3xl mb-6 px-4">
          <Select defaultValue="zebvo-4">
            <SelectTrigger className="w-fit mx-auto border-border bg-background rounded-lg">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zebvo-4">Model : Zebvo 4.0</SelectItem>
              <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
              <SelectItem value="claude">Claude Sonnet 4</SelectItem>
              <SelectItem value="gemini">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Chat Area */}
        <div className="w-full max-w-5xl flex-1 flex flex-col px-4">
          <Chat />
          
          {/* Mode Selector */}
          <div className="py-6">
            <ModeSelector />
          </div>
          
          {/* Disclaimer */}
          <p className="text-center text-xs text-muted-foreground pb-6">
            Zebvo AI can make mistakes. Check important info.{' '}
            <button className="underline hover:text-foreground transition-colors">
              See Cookie Preferences
            </button>
            .
          </p>
        </div>
      </div>
      
      {/* Scroll to top button */}
      <button className="fixed bottom-8 right-8 p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform">
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Index;
