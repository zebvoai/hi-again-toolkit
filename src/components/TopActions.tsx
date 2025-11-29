import { Users, Glasses, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { TestRunner } from '@/components/TestRunnerSimple';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface TopActionsProps {
  isTemporaryMode: boolean;
  onTemporaryModeToggle: () => void;
}

export function TopActions({ isTemporaryMode, onTemporaryModeToggle }: TopActionsProps) {
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showTempConfirm, setShowTempConfirm] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);

  const handleTemporaryClick = () => {
    if (!isTemporaryMode) {
      setShowTempConfirm(true);
    } else {
      onTemporaryModeToggle();
    }
  };

  const handleConfirmTemporary = () => {
    setShowTempConfirm(false);
    onTemporaryModeToggle();
  };

  return (
    <>
      <div className="fixed top-5 right-6 z-50 flex items-center gap-3">
        {/* Test Runner Icon */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTestRunner(true)}
                className="w-10 h-10 rounded-lg bg-transparent hover:bg-muted/80 transition-all duration-150 hover:scale-105 active:scale-95"
                aria-label="Test Runner"
              >
                <FlaskConical className="w-5 h-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Run Platform Tests</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Group Chat Icon */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGroupDialog(true)}
                className="w-10 h-10 rounded-lg bg-transparent hover:bg-muted/80 transition-all duration-150 hover:scale-105 active:scale-95"
                aria-label="Group Chat"
              >
                <Users className="w-5 h-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Group Chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Temporary Chat Icon */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleTemporaryClick}
                className={`w-10 h-10 rounded-lg transition-all duration-150 hover:scale-105 active:scale-95 ${
                  isTemporaryMode
                    ? 'bg-blue-50 border border-[#5B9FFF] text-[#5B9FFF] hover:bg-blue-50'
                    : 'bg-transparent hover:bg-muted/80'
                }`}
                aria-label="Temporary Chat"
              >
                <Glasses 
                  className={`w-5 h-5 ${
                    isTemporaryMode ? 'text-[#5B9FFF]' : 'text-muted-foreground'
                  }`} 
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Temporary Chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Group Chat Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Chat</DialogTitle>
            <DialogDescription>
              Collaborate with multiple users in a shared conversation.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Create Group
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Join Group
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Recent Groups
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Temporary Chat Confirmation */}
      <AlertDialog open={showTempConfirm} onOpenChange={setShowTempConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Temporary Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This conversation will not be saved to your chat history. All messages will be cleared when you exit temporary mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTemporary}>
              Start Temporary Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Runner Dialog */}
      <TestRunner open={showTestRunner} onOpenChange={setShowTestRunner} />
    </>
  );
}
