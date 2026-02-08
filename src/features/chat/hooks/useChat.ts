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

// Helper to save a placeholder "generating" message to DB
const saveGeneratingPlaceholder = async (
  convId: string,
  assistantId: string,
  metadata: Record<string, any>
) => {
  try {
    await supabase.from('messages').insert({
      id: assistantId,
      conversation_id: convId,
      role: 'assistant',
      content: '',
      metadata: {
        ...metadata,
        generationStatus: 'generating',
      },
    });
  } catch (error) {
    console.error('[useChat] Failed to save generating placeholder:', error);
  }
};

// Helper to update a completed message in DB (replaces placeholder)
const updateCompletedMessage = async (
  convId: string,
  assistantId: string,
  content: any,
  metadata: Record<string, any>
) => {
  try {
    // Remove generationStatus from final metadata (it's complete)
    const { generationStatus, ...cleanMetadata } = metadata;
    
    await supabase.from('messages')
      .update({
        content,
        metadata: { ...cleanMetadata, generationStatus: 'complete' },
      })
      .eq('id', assistantId)
      .eq('conversation_id', convId);
    
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId);
  } catch (error) {
    console.error('[useChat] Failed to update completed message:', error);
  }
};

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
    setCurrentGeneratingModel,
  } = useChatStore();
  const { selectedMode } = useModeStore();
  const { toast } = useToast();
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const cooldownMs = 2000;
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track which conversation the current request belongs to
  const requestConversationIdRef = useRef<string | null>(null);
  
  // Research-specific state
  const [researchStatus, setResearchStatus] = useState<DeepResearchProgress['status']>('researching');
  const [researchPhase, setResearchPhase] = useState<DeepResearchProgress['phase']>('search');
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
  
  // Helper to check if we're still on the same conversation
  const isStillOnSameConversation = (targetConvId: string | null) => {
    const currentId = useChatStore.getState().currentConversationId;
    return currentId === targetConvId;
  };
  
  // Safe addMessage - only adds if still on the same conversation, marks stale otherwise
  const safeAddMessage = (message: any, targetConvId: string | null) => {
    if (isStillOnSameConversation(targetConvId)) {
      addMessage(message);
    } else {
      console.log('[useChat] Skipping addMessage - user switched conversations, marking stale:', targetConvId);
      if (targetConvId) {
        useChatStore.getState().markConversationStale(targetConvId);
      }
    }
  };
  
  // Safe updateMessage - only updates if still on the same conversation, marks stale otherwise
  const safeUpdateMessage = (messageId: string, updates: any, targetConvId: string | null) => {
    if (isStillOnSameConversation(targetConvId)) {
      updateMessage(messageId, updates);
    } else {
      console.log('[useChat] Skipping updateMessage - user switched conversations, marking stale:', targetConvId);
      if (targetConvId) {
        useChatStore.getState().markConversationStale(targetConvId);
      }
    }
  };
  
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
    
    // === OPTIMISTIC UI: Show user message IMMEDIATELY with local blob previews ===
    const localPreviewUrls = files && files.length > 0
      ? files.map(f => URL.createObjectURL(f))
      : [];
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content,
      timestamp: Date.now(),
      metadata: localPreviewUrls.length > 0 ? { attachments: localPreviewUrls } : undefined,
    };
    
    // Show the blue bubble AND skeleton loader instantly — no waiting for DB or uploads
    addMessage(userMessage);
    setLoading(true, currentConversationId || 'optimistic');
    setError(null);
    
    // === BACKGROUND: Create conversation if needed ===
    let convId = currentConversationId;
    if (!convId && messages.length === 0) {
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
    
    // Store the conversation ID this request is for
    requestConversationIdRef.current = convId;
    // Update loading state with real conversation ID now that we have it
    if (convId) setLoading(true, convId);

    // === BACKGROUND: Upload files in parallel and replace blob URLs with real ones ===
    let fileUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        const uploadPromises = files.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${convId || 'temp'}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file);
          
          if (uploadError) {
            console.error('File upload error:', uploadError);
            return null;
          }
          
          const { data: urlData } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(filePath);
          
          if (urlData?.publicUrl) {
            // Save images to library (fire-and-forget)
            const isImage = file.type.startsWith('image/');
            if (isImage) {
              saveImageToLibrary({
                url: urlData.publicUrl,
                source_type: 'uploaded',
                filename: file.name,
                mime_type: file.type,
                size_bytes: file.size,
                conversation_id: convId || undefined,
              });
            }
            return urlData.publicUrl;
          }
          return null;
        });
        
        const results = await Promise.all(uploadPromises);
        fileUrls = results.filter((url): url is string => url !== null);
        
        // Update message metadata with real URLs (replace blob previews)
        if (fileUrls.length > 0) {
          updateMessage(userMessage.id, { metadata: { ...userMessage.metadata, attachments: fileUrls } });
          // Revoke blob URLs to free memory
          localPreviewUrls.forEach(url => URL.revokeObjectURL(url));
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

    // Save user message to database with real URLs
    if (convId) {
      await supabase.from('messages').insert({
        id: userMessage.id,
        conversation_id: convId,
        role: userMessage.role,
        content: userMessage.content,
        metadata: fileUrls.length > 0 ? { attachments: fileUrls } : userMessage.metadata,
      });
    }
    
    // Use crypto.randomUUID so assistantId works as DB primary key
    const assistantId = crypto.randomUUID();
    
    try {
      // Handle Deep Research mode - uses fixed 3-model pipeline
      if (selectedMode === 'research') {
        const placeholderMetadata = {
          models: ['Claude', 'Gemini', 'GPT-5'],
          provider: 'deep-research',
          isResearch: true,
          generationStatus: 'generating' as const,
          generationMode: 'research',
        };
        
        // Save placeholder to DB before starting
        if (convId) {
          await saveGeneratingPlaceholder(convId, assistantId, placeholderMetadata);
        }

        // Clear any existing timer first
        if (researchTimerRef.current) {
          clearInterval(researchTimerRef.current);
          researchTimerRef.current = null;
        }
        
        // Reset and start elapsed time counter
        setResearchElapsedTime(0);
        setResearchStatus('researching');
        setResearchPhase('search');
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
              // Update the generating model indicator
              if (progress.currentModel) {
                setCurrentGeneratingModel(progress.currentModel);
              }
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
              generationStatus: 'complete',
              generationMode: 'research',
            }
          };
          
          safeAddMessage(assistantMessage, convId);
          
          if (convId) {
            await updateCompletedMessage(convId, assistantId, assistantMessage.content, assistantMessage.metadata || {});
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
        // Check if there are image attachments for image-to-image generation
        const imageAttachments = fileUrls.filter(url => 
          url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes('image')
        );
        const sourceImage = imageAttachments.length > 0 ? imageAttachments[0] : undefined;
        
        if (sourceImage) {
          console.log('Image-to-image mode: using source image', sourceImage);
        }
        
        // Get selected aspect ratio from store
        const aspectRatio = useChatStore.getState().selectedAspectRatio;
        
        // Handle multi-model image generation with progressive loading
        if (selectedModels.length > 1) {
          // Initialize with empty content for all models
          const multiModelContent: MultiModelContent = {};
          selectedModels.forEach(model => {
            multiModelContent[model] = ''; // Empty = loading state
          });
          
          const placeholderMetadata = {
            models: selectedModels,
            isImage: true,
            isImageToImage: !!sourceImage,
            aspectRatio,
            prompt: content,
            generationStatus: 'generating' as const,
            generationMode: 'image',
          };
          
          // Save placeholder to DB before starting
          if (convId) {
            await saveGeneratingPlaceholder(convId, assistantId, placeholderMetadata);
          }
          
          // Add placeholder message immediately for progressive rendering
          const assistantMessage: Message = {
            id: assistantId,
            role: 'assistant' as const,
            content: { ...multiModelContent },
            timestamp: Date.now(),
            metadata: placeholderMetadata,
          };
          safeAddMessage(assistantMessage, convId);
          
          // Generate images progressively - update as each completes
          const imagePromises = selectedModels.map(async (model) => {
            try {
              const response = await api.generateImage(
                content, 
                undefined, 
                model.toLowerCase().replace(/\s+/g, '-'),
                abortControllerRef.current?.signal,
                sourceImage,
                undefined,
                undefined,
                undefined,
                aspectRatio
              );
              
              // Update the message content progressively
              multiModelContent[model] = response.imageUrl;
              safeUpdateMessage(assistantId, { 
                content: { ...multiModelContent } 
              }, convId);
              
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
              // Silently mark as empty - no error shown to user
              console.warn(`[Image] Model ${model} failed silently:`, error);
              multiModelContent[model] = ''; // Keep as loading/empty, will be hidden
              safeUpdateMessage(assistantId, { 
                content: { ...multiModelContent } 
              }, convId);
              return { model, url: null };
            }
          });

          await Promise.all(imagePromises);

          // Update local state metadata to complete
          const finalImageMetadata = {
            models: selectedModels,
            isImage: true,
            isImageToImage: !!sourceImage,
            aspectRatio,
            prompt: content,
            generationStatus: 'complete' as const,
            generationMode: 'image',
          };
          safeUpdateMessage(assistantId, { 
            content: { ...multiModelContent },
            metadata: finalImageMetadata,
          }, convId);

          // Update completed message in DB
          if (convId) {
            await updateCompletedMessage(convId, assistantId, multiModelContent, finalImageMetadata);
          }

          toast({
            title: sourceImage ? 'Images transformed' : 'Images generated',
            description: `${sourceImage ? 'Transformed' : 'Generated'} images with ${selectedModels.length} models`,
          });
        } else {
          const selectedModel = selectedModels[0] || 'DALL-E 3';
          
          const placeholderMetadata = {
            models: [selectedModel],
            isImage: true,
            isImageToImage: !!sourceImage,
            aspectRatio,
            prompt: content,
            generationStatus: 'generating' as const,
            generationMode: 'image',
          };
          
          // Save placeholder to DB before starting
          if (convId) {
            await saveGeneratingPlaceholder(convId, assistantId, placeholderMetadata);
          }
          
          // Use same multi-model object format for consistency (single model = object with 1 key)
          const singleModelContent: MultiModelContent = { [selectedModel]: '' };
          
          const placeholderMessage: Message = {
            id: assistantId,
            role: 'assistant' as const,
            content: { ...singleModelContent },
            timestamp: Date.now(),
            metadata: placeholderMetadata,
          };
          safeAddMessage(placeholderMessage, convId);
          
          try {
            const response = await api.generateImage(
              content, 
              undefined, 
              selectedModel.toLowerCase().replace(/\s+/g, '-'),
              abortControllerRef.current?.signal,
              sourceImage,
              undefined,
              undefined,
              undefined,
              aspectRatio
            );
            
            // Save generated image to library
            await saveImageToLibrary({
              url: response.imageUrl,
              source_type: 'generated',
              prompt: content,
              model: selectedModel,
              conversation_id: convId || undefined,
            });
            
            singleModelContent[selectedModel] = response.imageUrl;
            
            const finalMetadata = {
              models: [selectedModel],
              isImage: true,
              isImageToImage: !!sourceImage,
              aspectRatio,
              prompt: content,
              generationStatus: 'complete' as const,
              generationMode: 'image',
            };
            
            safeUpdateMessage(assistantId, { 
              content: { ...singleModelContent },
              metadata: finalMetadata,
            }, convId);
            
            if (convId) {
              await updateCompletedMessage(convId, assistantId, singleModelContent, finalMetadata);
            }
          } catch (error) {
            // Silently keep as empty - no error shown
            console.warn('[Image] Single model failed silently:', error);
            singleModelContent[selectedModel] = '';
            safeUpdateMessage(assistantId, { 
              content: { ...singleModelContent } 
            }, convId);
          }
          
          toast({
            title: sourceImage ? 'Image transformed' : 'Image generated',
            description: `${sourceImage ? 'Transformed' : 'Generated'} image with ${selectedModel}`,
          });
        }
      } else if (selectedMode === 'video') {
        const videoModels = ['Gemini Video 2.0', 'Gemini Video Flash'];
        const filteredModels = selectedModels.filter(m => videoModels.includes(m));
        
        if (filteredModels.length === 0) {
          throw new Error('No video model selected. Please select a Gemini video model.');
        }
        
        const selectedModel = filteredModels[0];
        
        const placeholderMetadata = {
          model: selectedModel,
          generationStatus: 'generating' as const,
          generationMode: 'video',
        };
        
        // Save placeholder to DB before starting
        if (convId) {
          await saveGeneratingPlaceholder(convId, assistantId, placeholderMetadata);
        }
        
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
            model: selectedModel,
            generationStatus: 'complete',
            generationMode: 'video',
          }
        };
        
        safeAddMessage(assistantMessage, convId);
        
        if (convId) {
          await updateCompletedMessage(convId, assistantId, assistantMessage.content, assistantMessage.metadata || {});
        }
        
        toast({
          title: 'Video generated',
          description: 'Your video has been created successfully',
        });
      } else if (selectedModels.length > 1) {
        // Multi-model mode: ALWAYS use all selected models (even when images are attached)
        // Vision-capable models will receive multimodal content, others will receive text + attachment references.
        const effectiveModels = selectedModels;
        
        const multiModelContent: MultiModelContent = {};
        effectiveModels.forEach(model => {
          multiModelContent[model] = '';
        });

        const placeholderMetadata = {
          models: effectiveModels,
          generationStatus: 'generating' as const,
          generationMode: 'text',
        };
        
        // Save placeholder to DB before starting
        if (convId) {
          await saveGeneratingPlaceholder(convId, assistantId, placeholderMetadata);
        }

        // Add placeholder message immediately for instant feedback
        const streamingMessage: Message = {
          id: assistantId,
          role: 'assistant' as const,
          content: { ...multiModelContent },
          timestamp: Date.now(),
          metadata: placeholderMetadata,
        };
        safeAddMessage(streamingMessage, convId);

        const response = await multiModelApi.sendMessageMultiModel(
          content,
          selectedMode,
          messages,
          effectiveModels,
          (modelName: string, chunk: string) => {
            // Update the generating model indicator when receiving from a model
            setCurrentGeneratingModel(modelName);
            multiModelContent[modelName] += chunk;
            safeUpdateMessage(assistantId, { content: { ...multiModelContent } }, convId);
          },
          abortControllerRef.current?.signal,
          fileUrls.length > 0 ? fileUrls : undefined
        );

        // Update with final content
        const finalMetadata = {
          models: response.models,
          generationStatus: 'complete' as const,
          generationMode: 'text',
        };
        safeUpdateMessage(assistantId, { content: response.content, metadata: finalMetadata }, convId);
        
        if (convId) {
          await updateCompletedMessage(convId, assistantId, response.content, finalMetadata);
        }
      } else {
        // Single-model mode: keep the user's selection even if images are attached.
        // Non-vision models will receive a note + attachment references.
        let selectedModel = selectedModels[0];
        
        const placeholderMetadata = {
          model: selectedModel || 'AI',
          generationStatus: 'generating' as const,
          generationMode: 'text',
        };
        
        // Save placeholder to DB before starting
        if (convId) {
          await saveGeneratingPlaceholder(convId, assistantId, placeholderMetadata);
        }
        
        let streamingContent = '';
        let hasCreatedMessage = false;
        const isOpenAIModel = selectedModel?.startsWith('GPT') || selectedModel?.startsWith('O');
        
        // Set initial model as generating
        if (selectedModel) {
          setCurrentGeneratingModel(selectedModel);
        }

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
                      provider: 'openai',
                      generationStatus: 'generating' as const,
                      generationMode: 'text',
                    }
                  };
                  safeAddMessage(streamingMessage, convId);
                  hasCreatedMessage = true;
                } else {
                  safeUpdateMessage(assistantId, { content: streamingContent }, convId);
                }
              }
            : undefined,
          abortControllerRef.current?.signal,
          fileUrls.length > 0 ? fileUrls : undefined,
          (model: string) => setCurrentGeneratingModel(model) // onModelChange callback
        );
        
        if (hasCreatedMessage) {
          const finalMetadata = {
            model: response.model,
            provider: response.provider,
            generationStatus: 'complete' as const,
            generationMode: 'text',
          };
          safeUpdateMessage(assistantId, { content: response.content || streamingContent, metadata: finalMetadata }, convId);
          
          if (convId) {
            await updateCompletedMessage(convId, assistantId, response.content || streamingContent, finalMetadata);
          }
        } else {
          const assistantMessage = {
            id: assistantId,
            role: 'assistant' as const,
            content: response.content,
            timestamp: Date.now(),
            metadata: {
              model: response.model,
              provider: response.provider,
              generationStatus: 'complete' as const,
              generationMode: 'text',
            }
          };
          safeAddMessage(assistantMessage, convId);
          
          if (convId) {
            await updateCompletedMessage(convId, assistantId, assistantMessage.content, assistantMessage.metadata || {});
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled by user');
        // Update the placeholder in DB to mark as interrupted
        if (convId) {
          await supabase.from('messages')
            .update({ 
              content: 'Generation was cancelled.',
              metadata: { generationStatus: 'interrupted', generationMode: selectedMode }
            })
            .eq('id', assistantId)
            .eq('conversation_id', convId);
        }
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      
      // For image mode, suppress error UI entirely - the image cards handle their own state
      if (selectedMode === 'image') {
        console.warn('[useChat] Image generation error suppressed:', errorMessage);
        // Mark as complete (not interrupted) so no error UI shows
        if (convId) {
          await supabase.from('messages')
            .update({ 
              metadata: { generationStatus: 'complete', generationMode: 'image' }
            })
            .eq('id', assistantId)
            .eq('conversation_id', convId);
        }
      } else {
        setError(errorMessage);
        
        const errorAssistantMessage = {
          id: assistantId,
          role: 'assistant' as const,
          content: 'Sorry, I encountered an error processing your request.',
          timestamp: Date.now(),
          metadata: {
            error: errorMessage,
            generationStatus: 'interrupted' as const,
            generationMode: selectedMode,
          }
        };
        safeAddMessage(errorAssistantMessage, convId);
        
        // Update DB placeholder with error
        if (convId) {
          await supabase.from('messages')
            .update({ 
              content: 'Sorry, I encountered an error processing your request.',
              metadata: { error: errorMessage, generationStatus: 'interrupted', generationMode: selectedMode }
            })
            .eq('id', assistantId)
            .eq('conversation_id', convId);
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
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
