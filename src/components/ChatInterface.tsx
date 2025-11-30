import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Mic, Volume2, Paperclip, Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/features/chat/hooks/useChat';
import { useModeStore } from '@/features/modes/store/modeStore';
import { useChatStore } from '@/features/chat/store/chatStore';
import { Message } from '@/features/chat/components/Message';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import { ModelSelector } from '@/features/chat/components/ModelSelector';
import { ModeDropdown } from '@/features/modes/components/ModeDropdown';
import { Badge } from '@/components/ui/badge';
import { TopActions } from '@/components/TopActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useModels } from '@/features/chat/hooks/useModels';
export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isTemporaryMode, setIsTemporaryMode] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAttachmentClicked, setIsAttachmentClicked] = useState(false);
  const {
    messages,
    sendMessage,
    isLoading,
    retryMessage,
    cancelGeneration
  } = useChat();
  const {
    selectedMode
  } = useModeStore();
  const {
    selectedModels,
    isModelLocked,
    setSelectedModels
  } = useChatStore();
  const { models } = useModels();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset selected models when mode changes (unless models are locked)
  useEffect(() => {
    if (isModelLocked || !models) return; // Don't reset if models are locked in a conversation

    const defaultModels: Record<string, string> = {
      text: 'GPT-5',
      image: 'DALL-E 3',
      video: 'Gemini Video 2.0',
      build: 'GPT-5'
    };
    
    // Get available models for current mode
    const availableModelsForMode = models[selectedMode] || [];
    
    // Filter out models that don't belong to current mode
    const validModels = selectedModels.filter(model => 
      availableModelsForMode.includes(model)
    );
    
    // If no valid models remain, set the default model
    if (validModels.length === 0) {
      const defaultModel = defaultModels[selectedMode] || 'GPT-5';
      setSelectedModels([defaultModel]);
    } else if (validModels.length !== selectedModels.length) {
      // Some models were invalid, update to only valid ones
      setSelectedModels(validModels);
    }
  }, [selectedMode, isModelLocked, models, selectedModels, setSelectedModels]);

  // Initialize with default model if none selected
  useEffect(() => {
    if (selectedModels.length === 0) {
      setSelectedModels(['GPT-5']);
    }
  }, [selectedModels.length, setSelectedModels]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, isLoading]);

  const hasMultiModelResponses = messages.some(
    (message) =>
      message.role === 'assistant' &&
      typeof message.content === 'object' &&
      !Array.isArray(message.content)
  );
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && selectedModels.length > 0) {
      sendMessage(input);
      setInput('');
      setAttachedFiles([]);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const triggerFileInput = () => {
    setIsAttachmentClicked(true);
    setTimeout(() => setIsAttachmentClicked(false), 200);
    fileInputRef.current?.click();
  };

  const handleMicClick = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual recording functionality
  };
  const handleTemporaryModeToggle = () => {
    setIsTemporaryMode(!isTemporaryMode);
  };
  const getPlaceholder = () => {
    const basePlaceholder = (() => {
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
    })();
    return isTemporaryMode ? `${basePlaceholder} (Temporary Mode)` : basePlaceholder;
  };
  return <div className="flex flex-col h-full relative bg-gray-50/50">
      {/* Top Actions */}
      <TopActions isTemporaryMode={isTemporaryMode} onTemporaryModeToggle={handleTemporaryModeToggle} />

      {/* Temporary Mode Banner */}
      {isTemporaryMode && <div className="px-4 pt-4">
          <Alert className="bg-blue-50 border-blue-200 max-w-4xl mx-auto">
            <AlertDescription className="text-blue-900 text-sm flex items-center gap-2">
              🕶️ <span className="font-medium">Temporary Chat Mode</span> — This conversation is private and won't be saved
            </AlertDescription>
          </Alert>
        </div>}

      {/* Messages Area */}
      {messages.length > 0 ? <div className="flex-1 overflow-y-auto px-6 py-8 bg-white">
          <div className={hasMultiModelResponses ? 'w-full' : 'max-w-[800px] mx-auto'}>
            {messages.map(message => <Message key={message.id} message={message} allMessages={messages} onRetry={() => retryMessage(typeof message.content === 'string' ? message.content : '')} />)}
            {isLoading && <TypingIndicator models={selectedModels} />}
            <div ref={messagesEndRef} />
          </div>
        </div> : (/* Empty State */
    <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-blue-500 mb-3 animate-logo-entrance animate-float-gentle hover:scale-[1.02] transition-transform duration-300 cursor-default">
              Zebvo AI
            </h1>
            <p className="text-muted-foreground text-base mb-6 animate-tagline-entrance">
              The World's Greatest AI Platform
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#5B9FFF] animate-dot-pulse-wave" />
              <div className="w-2 h-2 rounded-full bg-[#B8D4FF] animate-dot-pulse-wave" style={{
            animationDelay: '0.2s'
          }} />
              <div className="w-2 h-2 rounded-full bg-[#B8D4FF] animate-dot-pulse-wave" style={{
            animationDelay: '0.4s'
          }} />
            </div>
          </div>
        </div>)}

      {/* Chat Input Area */}
      <div className="p-4 pb-6">
        <div key={selectedMode} className="max-w-4xl mx-auto animate-scale-in">
          {isModelLocked && <div className="flex justify-center mb-3">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 px-4 py-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                Model locked for this conversation
              </Badge>
            </div>}
          <form onSubmit={handleSubmit}>
            {/* Dropdowns Row - Keep above input */}
            <div className="flex items-center gap-2.5 mb-3">
              <ModeDropdown />
              {selectedMode !== 'video' && (
                <ModelSelector values={selectedModels} onChange={setSelectedModels} disabled={isModelLocked} />
              )}
            </div>

            {/* File Attachments Preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 p-3 bg-white rounded-2xl border border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-700 truncate max-w-[200px]">{file.name}</span>
                      <span className="text-gray-400 text-xs">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveFile(index)} 
                        className="text-gray-400 hover:text-gray-600 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden File Input */}
            <input 
              ref={fileInputRef} 
              type="file" 
              multiple 
              accept="*/*" 
              onChange={handleFileSelect} 
              className="hidden" 
            />

            {/* New Input Bar Design */}
            <div className="flex items-center w-full h-[60px] bg-[#F5F6FA] rounded-[50px] px-5 border-[0.5px] border-gray-300 shadow-[0_1px_2px_rgba(0,0,0,0.08)] focus-within:shadow-[0_0_0_1px_rgba(30,100,255,0.4)] focus-within:border-[#1E64FF] transition-all duration-200">
              {/* Left Plus Button */}
              <button
                type="button"
                onClick={triggerFileInput}
                className="flex-shrink-0 w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4V16M4 10H16" stroke="#1E64FF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Input Field */}
              <input 
                type="text" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Ask to Zebvo ai" 
                disabled={isLoading} 
                className="flex-1 bg-transparent outline-none text-[17px] font-medium placeholder:text-[#6F7287] placeholder:font-medium disabled:opacity-50 px-4" 
                maxLength={4000}
              />

              {/* Right Send Button */}
              <button
                type={isLoading ? "button" : "submit"} 
                onClick={isLoading ? cancelGeneration : undefined} 
                disabled={!isLoading && (!input.trim() || selectedModels.length === 0)}
                className={`flex-shrink-0 w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all ${
                  isLoading 
                    ? 'bg-gray-700 hover:bg-gray-800 animate-pulse' 
                    : !input.trim() || selectedModels.length === 0
                      ? 'bg-white cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 active:scale-95'
                }`}
              >
                {isLoading ? (
                  <Square className="w-4 h-4 fill-white" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M3 10L17 10M17 10L11 4M17 10L11 16" stroke="#6F7287" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Info */}
          <div className="flex items-center justify-between mt-2 px-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>~0 tokens</span>
              <span>• {selectedModels.length} {selectedModels.length === 1 ? 'model' : 'models'}</span>
            </div>
            <span>{input.length}/4000</span>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      
    </div>;
}