import { useState } from 'react';
import { ThumbsDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ResponseFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  messageContent: string;
  model?: string;
}

export function ResponseFeedbackDialog({ 
  open, 
  onOpenChange, 
  messageId,
  messageContent,
  model 
}: ResponseFeedbackDialogProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to submit feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      // Store as bug feedback with context about the response
      const description = `[Response Feedback - Dislike]\n\nModel: ${model || 'Unknown'}\nMessage ID: ${messageId}\n\nUser Feedback:\n${feedback.trim() || 'No additional feedback provided'}\n\nResponse Content (first 500 chars):\n${messageContent.substring(0, 500)}...`;

      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        type: 'bug' as const,
        description,
        image_urls: [],
      } as any);

      if (error) throw error;

      toast.success('Thanks for your feedback! We\'ll use it to improve.');
      setFeedback('');
      onOpenChange(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFeedback('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <ThumbsDown className="w-5 h-5 text-muted-foreground" />
            What went wrong?
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm font-medium">
              Tell us how we can improve (optional)
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="The response was inaccurate, irrelevant, or unhelpful because..."
              className="min-h-[100px] resize-none rounded-xl"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Your feedback helps us improve the AI responses. The response content will be included for context.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/30 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl gap-2"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
