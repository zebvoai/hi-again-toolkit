import { Users, Glasses } from 'lucide-react';
import { useState } from 'react';
import { TestRunner } from '@/components/TestRunnerSimple';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
interface TopActionsProps {
  isTemporaryMode: boolean;
  onTemporaryModeToggle: () => void;
}
export function TopActions({
  isTemporaryMode,
  onTemporaryModeToggle
}: TopActionsProps) {
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showTempConfirm, setShowTempConfirm] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [groupClicked, setGroupClicked] = useState(false);
  const [settingsClicked, setSettingsClicked] = useState(false);
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
  const handleGroupClick = () => {
    setGroupClicked(true);
    setTimeout(() => setGroupClicked(false), 400);
    setShowGroupDialog(true);
  };
  const handleSettingsClick = () => {
    setSettingsClicked(true);
    setTimeout(() => setSettingsClicked(false), 300);
    setShowTestRunner(true);
  };
  return <>
      <div className="fixed top-5 right-6 z-50 flex items-center gap-3">
        {/* Settings Icon */}
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleSettingsClick} className="w-10 h-10 rounded-full bg-transparent hover:bg-accent/80 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] active:scale-[0.92] active:transition-[transform] active:duration-100 transition-all duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" aria-label="Settings">
                
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Group Chat Icon */}
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Group Chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Temporary Chat Icon */}
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleTemporaryClick} className={`w-10 h-10 rounded-full transition-all duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isTemporaryMode ? 'bg-primary/10 border-[1.5px] border-primary text-primary hover:bg-primary/15' : 'bg-transparent hover:bg-accent/80 border border-transparent'} hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] active:scale-[0.92] active:transition-[transform] active:duration-100`} aria-label="Temporary Chat">
                <Glasses className={`w-5 h-5 ${isTemporaryMode ? 'text-primary' : 'text-muted-foreground'}`} />
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
    </>;
}