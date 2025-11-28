import { api } from '@/lib/api';
import { useChatStore } from '../store/chatStore';
import { useModeStore } from '@/features/modes/store/modeStore';
import { useToast } from '@/hooks/use-toast';

export const useChat = () => {
  const { messages, addMessage, updateMessage, setLoading, setError, isLoading } = useChatStore();
  const { selectedMode } = useModeStore();
  const { toast } = useToast();
  
  const sendMessage = async (content: string, selectedModel?: string) => {
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: Date.now()
    };
    
    addMessage(userMessage);
    setLoading(true);
    setError(null);
    
    // Add placeholder for assistant response
    const assistantId = (Date.now() + 1).toString();
    
    try {
      if (selectedMode === 'image') {
        const response = await api.generateImage(content);
        
        const assistantMessage = {
          id: assistantId,
          role: 'assistant' as const,
          content: response.revisedPrompt || content,
          timestamp: Date.now(),
          metadata: {
            imageUrl: response.imageUrl,
            model: 'DALL-E 3'
          }
        };
        
        addMessage(assistantMessage);
        
        toast({
          title: 'Image generated',
          description: 'Your image has been created successfully',
        });
      } else {
        const response = await api.sendMessage(
          content,
          selectedMode,
          messages,
          undefined,
          selectedModel
        );
        
        const assistantMessage = {
          id: assistantId,
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
      
      // Add error message
      const errorAssistantMessage = {
        id: assistantId,
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: Date.now(),
        metadata: {
          error: errorMessage
        }
      };
      addMessage(errorAssistantMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const retryMessage = async (content: string, selectedModel?: string) => {
    await sendMessage(content, selectedModel);
  };
  
  return { messages, sendMessage, isLoading, retryMessage };
};
