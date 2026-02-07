import { AlertTriangle } from 'lucide-react';
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

interface DeepResearchConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const DeepResearchConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: DeepResearchConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <AlertDialogTitle className="text-[17px] font-semibold">
              Deep Research Mode
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[14px] text-muted-foreground space-y-3">
            <p>
              Deep Research provides comprehensive, detailed answers that are typically{' '}
              <span className="font-semibold text-foreground">over 6,000 words</span>.
            </p>
            <p>
              This thorough analysis will take{' '}
              <span className="font-semibold text-foreground">more than 5 minutes</span>{' '}
              to complete.
            </p>
            <p className="text-xs text-muted-foreground/80 pt-1">
              For quick answers, consider using standard text mode instead.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-2">
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            I Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
