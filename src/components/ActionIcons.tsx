import { useState } from 'react';
import { Users, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useChatStore } from '@/features/chat/store/chatStore';

export function ActionIcons() {
  const [showTempConfirm, setShowTempConfirm] = useState(false);
  const [groupChatOpen, setGroupChatOpen] = useState(false);
  const { isTemporaryMode, setTemporaryMode, clearMessages } = useChatStore();

  const handleTemporaryModeToggle = () => {
    if (isTemporaryMode) {
      // Exit temporary mode
      setTemporaryMode(false);
      clearMessages();
    } else {
      // Show confirmation before entering temporary mode
      setShowTempConfirm(true);
    }
  };

  const confirmTemporaryMode = () => {
    setTemporaryMode(true);
    clearMessages();
    setShowTempConfirm(false);
  };

  return (
    <>
      <TooltipProvider delayDuration={500}>
        <div className="fixed top-5 right-6 z-50 flex items-center gap-3">
          {/* Group Chat Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover open={groupChatOpen} onOpenChange={setGroupChatOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-lg bg-transparent hover:bg-muted/60 hover:scale-105 active:scale-95 transition-all duration-150"
                    aria-label="Group Chat"
                  >
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-64 frosted-glass border-border/50 shadow-xl" 
                  align="end"
                  sideOffset={8}
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">Group Chat</h4>
                      <p className="text-xs text-muted-foreground">
                        Create or join group conversations
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        className="w-full justify-start text-sm h-9" 
                        variant="outline"
                        onClick={() => {
                          setGroupChatOpen(false);
                          // TODO: Implement group creation
                        }}
                      >
                        Create New Group
                      </Button>
                      <Button 
                        className="w-full justify-start text-sm h-9" 
                        variant="outline"
                        onClick={() => {
                          setGroupChatOpen(false);
                          // TODO: Implement join group
                        }}
                      >
                        Join Existing Group
                      </Button>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground text-center">
                        No recent group chats
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="bg-gray-900 text-white text-xs px-3 py-1.5"
            >
              Group Chat
            </TooltipContent>
          </Tooltip>

          {/* Temporary/Incognito Chat Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTemporaryModeToggle}
                className={`w-10 h-10 rounded-lg transition-all duration-150 ${
                  isTemporaryMode
                    ? 'bg-blue-100 border border-blue-500 hover:bg-blue-200'
                    : 'bg-transparent hover:bg-muted/60'
                } hover:scale-105 active:scale-95`}
                aria-label="Temporary Chat"
              >
                <EyeOff 
                  className={`w-5 h-5 ${
                    isTemporaryMode ? 'text-blue-600' : 'text-muted-foreground'
                  }`} 
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="bg-gray-900 text-white text-xs px-3 py-1.5"
            >
              {isTemporaryMode ? 'Exit Temporary Mode' : 'Temporary Chat'}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Temporary Mode Confirmation Dialog */}
      <AlertDialog open={showTempConfirm} onOpenChange={setShowTempConfirm}>
        <AlertDialogContent className="frosted-glass border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-blue-600" />
              Start Temporary Chat?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This conversation won't be saved to history. Your messages will be private and 
              automatically cleared when you exit temporary mode or start a new regular chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmTemporaryMode}
              className="h-9 bg-blue-600 hover:bg-blue-700"
            >
              Start
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
