import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { multiModelApi } from '@/lib/multiModelApi';
import { useChatStore } from '../store/chatStore';
import { useModeStore } from '@/features/modes/store/modeStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { MultiModelContent, Message } from '@/types';

export const useChat = () => {
  const { 
    messages, 
    addMessage, 
    updateMessage, 
    setLoading, 
    setError, 
    isLoading, 
    selectedModels, 
    isModelLocked, 
    lockModels,
    currentConversationId,
    setCurrentConversationId 
  } = useChatStore();
  const { selectedMode } = useModeStore();
  const { toast } = useToast();
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const cooldownMs = 2000; // 2 second cooldown
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      toast({
        title: 'Generation cancelled',
        description: 'Response generation has been stopped.',
      });
    }
  };
  
  const sendMessage = async (content: string) => {
    // Rate limiting check
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < cooldownMs) {
      const waitTime = Math.ceil((cooldownMs - timeSinceLastRequest) / 1000);
      toast({
        title: 'Please wait',
        description: `You can send another message in ${waitTime} second${waitTime > 1 ? 's' : ''}`,
        variant: 'default',
      });
      return;
    }
    
    setLastRequestTime(now);
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    // Create conversation if this is the first message
    let convId = currentConversationId;
    if (!convId && messages.length === 0) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title })
        .select()
        .single();
      
      if (data && !error) {
        convId = data.id;
        setCurrentConversationId(convId);
      }
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: Date.now()
    };
    
    addMessage(userMessage);
    setLoading(true);
    setError(null);

    // Save user message to database
    if (convId) {
      await supabase.from('messages').insert({
        conversation_id: convId,
        role: userMessage.role,
        content: userMessage.content,
        metadata: userMessage.metadata
      });
    }

    // Lock models after first message
    if (!isModelLocked && messages.length === 0) {
      lockModels();
    }
    
    // Add placeholder for assistant response
    const assistantId = (Date.now() + 1).toString();
    
    try {
      if (selectedMode === 'image') {
        // Handle multi-model image generation
        if (selectedModels.length > 1) {
          let multiModelContent: MultiModelContent = {};
          const imagePromises = selectedModels.map(async (model) => {
            try {
              const response = await api.generateImage(
                content, 
                undefined, 
                model.toLowerCase().replace(/\s+/g, '-'),
                abortControllerRef.current?.signal
              );
              multiModelContent[model] = response.imageUrl;
              return { model, url: response.imageUrl };
            } catch (error) {
              multiModelContent[model] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
              return { model, url: null };
            }
          });

          // Wait for all images to generate
          await Promise.all(imagePromises);

          const assistantMessage: Message = {
            id: assistantId,
            role: 'assistant' as const,
            content: multiModelContent,
            timestamp: Date.now(),
            metadata: {
              models: selectedModels,
              isImage: true
            }
          };

          addMessage(assistantMessage);

          // Save to database
          if (convId) {
            await supabase.from('messages').insert({
              conversation_id: convId,
              role: assistantMessage.role,
              content: assistantMessage.content,
              metadata: assistantMessage.metadata
            });

            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', convId);
          }

          toast({
            title: 'Images generated',
            description: `Generated images with ${selectedModels.length} models`,
          });
        } else {
          // Single model image generation
          const selectedModel = selectedModels[0] || 'DALL-E 3';
          const response = await api.generateImage(
            content, 
            undefined, 
            selectedModel.toLowerCase().replace(/\s+/g, '-'),
            abortControllerRef.current?.signal
          );
          
          const assistantMessage: Message = {
            id: assistantId,
            role: 'assistant' as const,
            content: response.revisedPrompt || content,
            timestamp: Date.now(),
            metadata: {
              imageUrl: response.imageUrl,
              model: selectedModel
            }
          };
          
          addMessage(assistantMessage);
          
          // Save to database
          if (convId) {
            await supabase.from('messages').insert({
              conversation_id: convId,
              role: assistantMessage.role,
              content: assistantMessage.content,
              metadata: assistantMessage.metadata
            });
            
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', convId);
          }
          
          toast({
            title: 'Image generated',
            description: 'Your image has been created successfully',
          });
        }
      } else if (selectedMode === 'video') {
        // VIDEO MODE: Filter to only video models
        const videoModels = ['Runway Gen-2', 'Pika 1.0'];
        const filteredModels = selectedModels.filter(m => videoModels.includes(m));
        
        if (filteredModels.length === 0) {
          throw new Error('No video model selected. Please select Runway Gen-2 or Pika 1.0.');
        }
        
        const selectedModel = filteredModels[0];
        const response = await api.generateVideo(
          content,
          undefined,
          selectedModel.toLowerCase().replace(/\s+/g, '-'),
          abortControllerRef.current?.signal
        );
        
        const assistantMessage: Message = {
          id: assistantId,
          role: 'assistant' as const,
          content: `Video generated with ${selectedModel}`,
          timestamp: Date.now(),
          metadata: {
            videoUrl: response.videoUrl,
            model: selectedModel
          }
        };
        
        addMessage(assistantMessage);
        
        // Save to database
        if (convId) {
          await supabase.from('messages').insert({
            conversation_id: convId,
            role: assistantMessage.role,
            content: assistantMessage.content,
            metadata: assistantMessage.metadata
          });
          
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId);
        }
        
        toast({
          title: 'Video generated',
          description: 'Your video has been created successfully',
        });
      } else if (selectedModels.length > 1) {
        // Multi-model handling
        let multiModelContent: MultiModelContent = {};
        let hasCreatedMessage = false;

        selectedModels.forEach(model => {
          multiModelContent[model] = '';
        });

        const response = await multiModelApi.sendMessageMultiModel(
          content,
          selectedMode,
          messages,
          selectedModels,
          (modelName: string, chunk: string) => {
            // Update content for specific model
            multiModelContent[modelName] += chunk;

            if (!hasCreatedMessage) {
              const streamingMessage = {
                id: assistantId,
                role: 'assistant' as const,
                content: { ...multiModelContent },
                timestamp: Date.now(),
                metadata: {
                  models: selectedModels
                }
              };
              addMessage(streamingMessage);
              hasCreatedMessage = true;
            } else {
              updateMessage(assistantId, { content: { ...multiModelContent } });
            }
          },
          abortControllerRef.current?.signal
        );

        // Final update after all models complete
        if (hasCreatedMessage) {
          const finalMessage = {
            content: response.content,
            metadata: {
              models: response.models
            }
          };
          updateMessage(assistantId, finalMessage);
          
          // Save to database
          if (convId) {
            await supabase.from('messages').insert({
              conversation_id: convId,
              role: 'assistant',
              content: finalMessage.content,
              metadata: finalMessage.metadata
            });
            
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', convId);
          }
        } else {
          const assistantMessage: Message = {
            id: assistantId,
            role: 'assistant' as const,
            content: response.content,
            timestamp: Date.now(),
            metadata: {
              models: response.models
            }
          };
          addMessage(assistantMessage);
          
          // Save to database
          if (convId) {
            await supabase.from('messages').insert({
              conversation_id: convId,
              role: assistantMessage.role,
              content: assistantMessage.content,
              metadata: assistantMessage.metadata
            });
            
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', convId);
          }
        }
      } else {
        // Single model handling
        let streamingContent = '';
        let hasCreatedMessage = false;
        const selectedModel = selectedModels[0];
        const isOpenAIModel = selectedModel?.startsWith('GPT') || selectedModel?.startsWith('O');

        const response = await api.sendMessage(
          content,
          selectedMode,
          messages,
          undefined,
          selectedModel,
          isOpenAIModel
            ? (chunk: string) => {
                streamingContent += chunk;
                
                if (!hasCreatedMessage) {
                  const streamingMessage = {
                    id: assistantId,
                    role: 'assistant' as const,
                    content: streamingContent,
                    timestamp: Date.now(),
                    metadata: {
                      model: selectedModel || 'AI',
                      provider: 'openai'
                    }
                  };
                  addMessage(streamingMessage);
                  hasCreatedMessage = true;
                } else {
                  updateMessage(assistantId, { content: streamingContent });
                }
              }
            : undefined,
          abortControllerRef.current?.signal
        );
        
        if (hasCreatedMessage) {
          const finalMessage = {
            content: response.content || streamingContent,
            metadata: {
              model: response.model,
              provider: response.provider
            }
          };
          updateMessage(assistantId, finalMessage);
          
          // Save assistant message to database
          if (convId) {
            await supabase.from('messages').insert({
              conversation_id: convId,
              role: 'assistant',
              content: finalMessage.content,
              metadata: finalMessage.metadata
            });
            
            // Update conversation timestamp
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', convId);
          }
        } else {
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
          
          // Save to database
          if (convId) {
            await supabase.from('messages').insert({
              conversation_id: convId,
              role: assistantMessage.role,
              content: assistantMessage.content,
              metadata: assistantMessage.metadata
            });
            
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', convId);
          }
        }
      }
    } catch (error) {
      // Don't show error toast if user cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled by user');
        return;
      }
      
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
      abortControllerRef.current = null;
    }
  };
  
  const retryMessage = async (content: string) => {
    await sendMessage(content);
  };
  
  return { messages, sendMessage, isLoading, retryMessage, cancelGeneration };
};
