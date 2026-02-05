import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { multiModelApi } from '@/lib/multiModelApi';
import { deepResearchApi, type DeepResearchProgress } from '@/lib/deepResearchApi';
import { useChatStore } from '../store/chatStore';
import { useModeStore } from '@/features/modes/store/modeStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { MultiModelContent, Message } from '@/types';

// Helper to save image to user library
const saveImageToLibrary = async (imageData: {
  url: string;
  source_type: 'uploaded' | 'generated';
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  prompt?: string;
  model?: string;
  conversation_id?: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_images').insert({
      user_id: user.id,
      url: imageData.url,
      source_type: imageData.source_type,
      filename: imageData.filename || null,
      mime_type: imageData.mime_type || null,
      size_bytes: imageData.size_bytes || null,
      prompt: imageData.prompt || null,
      model: imageData.model || null,
      conversation_id: imageData.conversation_id || null,
    } as any);
  } catch (error) {
    console.error('Failed to save image to library:', error);
  }
};

// Vision-capable models that can process image attachments
const VISION_CAPABLE_MODELS = ['GPT-5', 'Claude Opus 4.5', 'Gemini 3 Pro'];

export const useChat = () => {
  const { 
    messages, 
    addMessage, 
    updateMessage, 
    setLoading, 
    setError, 
    isLoading, 
    selectedModels,
    currentConversationId,
    setCurrentConversationId,
    selectedProjectId,
    setSelectedProjectId,
    deleteMessage,
    deleteMessagesAfter,
    findUserMessageBefore,
  } = useChatStore();
  const { selectedMode } = useModeStore();
  const { toast } = useToast();
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const cooldownMs = 2000;
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Research-specific state
  const [researchStatus, setResearchStatus] = useState<DeepResearchProgress['status']>('researching');
  const [researchPhase, setResearchPhase] = useState<DeepResearchProgress['phase']>('parallel');
  const [researchProgress, setResearchProgress] = useState(0);
  const [researchElapsedTime, setResearchElapsedTime] = useState(0);
  const researchTimerRef = useRef<number | null>(null);
  
  // Cleanup research timer on unmount
  useEffect(() => {
    return () => {
      if (researchTimerRef.current) {
        clearInterval(researchTimerRef.current);
      }
    };
  }, []);
  
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

  // Regenerate a specific AI response using the cached user prompt
  const regenerateResponse = async (messageId: string) => {
    const userMessage = findUserMessageBefore(messageId);
    if (!userMessage || typeof userMessage.content !== 'string') {
      toast({
        title: 'Cannot regenerate',
        description: 'Could not find the original prompt.',
        variant: 'destructive',
      });
      return;
    }

    // Delete the AI message from database
    if (currentConversationId) {
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', currentConversationId)
        .eq('id', messageId);
    }

    // Delete from local state
    deleteMessage(messageId);

    // Re-send the original user prompt
    await sendMessage(userMessage.content);
  };

  // Edit a user message and regenerate all subsequent responses
  const editAndRegenerate = async (messageId: string, newContent: string) => {
    const messages = useChatStore.getState().messages;
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    
    // If it's a user message, edit it and delete everything after
    if (message.role === 'user') {
      // Update the user message content locally
      updateMessage(messageId, { content: newContent });

      // Delete all messages after this one from database
      if (currentConversationId) {
        const messagesAfter = messages.slice(messageIndex + 1);
        for (const msg of messagesAfter) {
          await supabase
            .from('messages')
            .delete()
            .eq('conversation_id', currentConversationId)
            .eq('id', msg.id);
        }
        
        // Update the user message in database
        await supabase
          .from('messages')
          .update({ content: newContent })
          .eq('conversation_id', currentConversationId)
          .eq('id', messageId);
      }

      // Delete messages after from local state
      deleteMessagesAfter(messageId);

      // Regenerate with new content
      await sendMessage(newContent);
    } else {
      // It's an AI message - find the user message before it and edit that
      const userMessage = findUserMessageBefore(messageId);
      if (userMessage) {
        await editAndRegenerate(userMessage.id, newContent);
      }
    }
  };
  
  const sendMessage = async (content: string, files?: File[]) => {
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
    
    abortControllerRef.current = new AbortController();
    
    // Create conversation if this is the first message
    let convId = currentConversationId;
    if (!convId && messages.length === 0) {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please log in to save your conversations',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      const insertData: { title: string; user_id: string; project_id?: string } = { 
        title, 
        user_id: user.id 
      };
      
      if (selectedProjectId) {
        insertData.project_id = selectedProjectId;
      }
      
      const { data, error } = await supabase
        .from('conversations')
        .insert(insertData)
        .select()
        .single();
      
      if (data && !error) {
        convId = data.id;
        setCurrentConversationId(convId);
      } else if (error) {
        console.error('Error creating conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to create conversation',
          variant: 'destructive',
        });
      }
    }

    // Handle file uploads if present
    let fileUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${convId || 'temp'}/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file);
          
          if (uploadError) {
            console.error('File upload error:', uploadError);
            continue;
          }
          
          const { data: urlData } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);
          
          if (urlData?.publicUrl) {
            fileUrls.push(urlData.publicUrl);
            
            // Save images to library
            const isImage = file.type.startsWith('image/');
            if (isImage) {
              await saveImageToLibrary({
                url: urlData.publicUrl,
                source_type: 'uploaded',
                filename: file.name,
                mime_type: file.type,
                size_bytes: file.size,
                conversation_id: convId || undefined,
              });
            }
          }
        }
      } catch (err) {
        console.error('Error uploading files:', err);
        toast({
          title: 'File upload failed',
          description: 'Some files could not be uploaded.',
          variant: 'destructive',
        });
      }
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: Date.now(),
      metadata: fileUrls.length > 0 ? { attachments: fileUrls } : undefined,
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
    
    const assistantId = (Date.now() + 1).toString();
    
    try {
      // Handle Deep Research mode - uses fixed 3-model pipeline
      if (selectedMode === 'research') {
        // Clear any existing timer first
        if (researchTimerRef.current) {
          clearInterval(researchTimerRef.current);
          researchTimerRef.current = null;
        }
        
        // Reset and start elapsed time counter
        setResearchElapsedTime(0);
        setResearchStatus('researching');
        setResearchPhase('parallel');
        setResearchProgress(0);
        
        // Use a small delay to ensure state is reset before starting timer
        const startTime = Date.now();
        researchTimerRef.current = window.setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setResearchElapsedTime(elapsed);
        }, 100); // Update more frequently for smoother display
        
        try {
          // Use the new deep research pipeline (Claude + Gemini -> GPT-5 synthesis)
          const response = await deepResearchApi.executeResearch(
            content,
            messages,
            (progress) => {
              setResearchStatus(progress.status);
              setResearchPhase(progress.phase);
              setResearchProgress(progress.progress);
            },
            abortControllerRef.current?.signal
          );
          
          // Clear timer
          if (researchTimerRef.current) {
            clearInterval(researchTimerRef.current);
            researchTimerRef.current = null;
          }
          
          const assistantMessage: Message = {
            id: assistantId,
            role: 'assistant' as const,
            content: response.content,
            timestamp: Date.now(),
            metadata: {
              model: response.model,
              models: response.modelsUsed,
              provider: 'deep-research',
              isResearch: true,
              researchStatus: 'complete',
            }
          };
          
          addMessage(assistantMessage);
          
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
            title: 'Deep Research complete',
            description: response.synthesized 
              ? 'Research synthesized from Claude, Gemini, and GPT-5'
              : 'Research completed (partial synthesis)',
          });
        } catch (error) {
          // Clear timer on error
          if (researchTimerRef.current) {
            clearInterval(researchTimerRef.current);
            researchTimerRef.current = null;
          }
          throw error;
        }
      } else if (selectedMode === 'image') {
        // Handle multi-model image generation with progressive loading
        if (selectedModels.length > 1) {
          // Initialize with empty content for all models
          const multiModelContent: MultiModelContent = {};
          selectedModels.forEach(model => {
            multiModelContent[model] = ''; // Empty = loading state
          });
          
          // Add placeholder message immediately for progressive rendering
          const assistantMessage: Message = {
            id: assistantId,
            role: 'assistant' as const,
            content: { ...multiModelContent },
            timestamp: Date.now(),
            metadata: {
              models: selectedModels,
              isImage: true
            }
          };
          addMessage(assistantMessage);
          
          // Generate images progressively - update as each completes
          const imagePromises = selectedModels.map(async (model) => {
            try {
              const response = await api.generateImage(
                content, 
                undefined, 
                model.toLowerCase().replace(/\s+/g, '-'),
                abortControllerRef.current?.signal
              );
              
              // Update the message content progressively
              multiModelContent[model] = response.imageUrl;
              updateMessage(assistantId, { 
                content: { ...multiModelContent } 
              });
              
              // Save generated image to library
              await saveImageToLibrary({
                url: response.imageUrl,
                source_type: 'generated',
                prompt: content,
                model: model,
                conversation_id: convId || undefined,
              });
              
              return { model, url: response.imageUrl };
            } catch (error) {
              multiModelContent[model] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
              updateMessage(assistantId, { 
                content: { ...multiModelContent } 
              });
              return { model, url: null };
            }
          });

          await Promise.all(imagePromises);

          // Save final message to database
          if (convId) {
            await supabase.from('messages').insert({
              conversation_id: convId,
              role: assistantMessage.role,
              content: multiModelContent,
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
          const selectedModel = selectedModels[0] || 'DALL-E 3';
          const response = await api.generateImage(
            content, 
            undefined, 
            selectedModel.toLowerCase().replace(/\s+/g, '-'),
            abortControllerRef.current?.signal
          );
          
          // Save generated image to library
          await saveImageToLibrary({
            url: response.imageUrl,
            source_type: 'generated',
            prompt: content,
            model: selectedModel,
            conversation_id: convId || undefined,
          });
          
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
        const videoModels = ['Gemini Video 2.0', 'Gemini Video Flash'];
        const filteredModels = selectedModels.filter(m => videoModels.includes(m));
        
        if (filteredModels.length === 0) {
          throw new Error('No video model selected. Please select a Gemini video model.');
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
        // Filter to vision-capable models only if images are attached
        const hasImages = fileUrls.length > 0;
        const modelsToUse = hasImages 
          ? selectedModels.filter(m => VISION_CAPABLE_MODELS.includes(m))
          : selectedModels;
        
        // If no vision models are selected but images are attached, use default vision models
        const effectiveModels = hasImages && modelsToUse.length === 0 
          ? VISION_CAPABLE_MODELS 
          : modelsToUse;
        
        const multiModelContent: MultiModelContent = {};
        effectiveModels.forEach(model => {
          multiModelContent[model] = '';
        });

        // Add placeholder message immediately for instant feedback
        const streamingMessage: Message = {
          id: assistantId,
          role: 'assistant' as const,
          content: { ...multiModelContent },
          timestamp: Date.now(),
          metadata: {
            models: effectiveModels
          }
        };
        addMessage(streamingMessage);

        const response = await multiModelApi.sendMessageMultiModel(
          content,
          selectedMode,
          messages,
          effectiveModels,
          (modelName: string, chunk: string) => {
            multiModelContent[modelName] += chunk;
            updateMessage(assistantId, { content: { ...multiModelContent } });
          },
          abortControllerRef.current?.signal,
          fileUrls.length > 0 ? fileUrls : undefined
        );

        // Update with final content
        const finalMessage = {
          content: response.content,
          metadata: {
            models: response.models
          }
        };
        updateMessage(assistantId, finalMessage);
        
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
        // For single model mode, force vision model if images are attached
        const hasImages = fileUrls.length > 0;
        let selectedModel = selectedModels[0];
        
        // If image attached but selected model isn't vision-capable, switch to first vision model
        if (hasImages && !VISION_CAPABLE_MODELS.includes(selectedModel)) {
          selectedModel = VISION_CAPABLE_MODELS[0]; // GPT-5
        }
        
        let streamingContent = '';
        let hasCreatedMessage = false;
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
          abortControllerRef.current?.signal,
          fileUrls.length > 0 ? fileUrls : undefined
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
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled by user');
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setError(errorMessage);
      
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
  
  return { 
    messages, 
    sendMessage, 
    isLoading, 
    retryMessage, 
    cancelGeneration,
    regenerateResponse,
    editAndRegenerate,
    researchStatus,
    researchPhase,
    researchProgress,
    researchElapsedTime,
  };
};
