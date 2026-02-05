-- Create enum for feedback type
CREATE TYPE public.feedback_type AS ENUM ('bug', 'feature');

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type feedback_type NOT NULL,
  description TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can create feedback
CREATE POLICY "Users can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON public.feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.feedback
FOR SELECT
USING (is_admin());

-- Admins can update feedback status
CREATE POLICY "Admins can update feedback"
ON public.feedback
FOR UPDATE
USING (is_admin());

-- Admins can delete feedback
CREATE POLICY "Admins can delete feedback"
ON public.feedback
FOR DELETE
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();