import { api } from '@/lib/api';
import { useChatStore } from '../store/chatStore';
import { useModeStore } from '@/features/modes/store/modeStore';
import { useToast } from '@/hooks/use-toast';

export const useChat = () => {
  const { messages, addMessage, setLoading, setError, isLoading } = useChatStore();
  const { selectedMode } = useModeStore();
  const { toast } = useToast();
  
  const sendMessage = async (content: string) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: Date.now()
    };
    
    addMessage(userMessage);
    setLoading(true);
    setError(null);
    
    try {
      if (selectedMode === 'image') {
        const response = await api.generateImage(content);
        
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: response.revisedPrompt || content,
          timestamp: Date.now(),
          metadata: {
            imageUrl: response.imageUrl
          }
        };
        
        addMessage(assistantMessage);
      } else {
        const response = await api.sendMessage(
          content,
          selectedMode,
          messages
        );
        
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: response.content,
          timestamp: Date.now(),
          metadata: {
            model: response.model,
            provider: response.provider
          }
        };
        
        addMessage(assistantMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return { messages, sendMessage, isLoading };
};
