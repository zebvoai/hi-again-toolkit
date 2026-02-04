-- Create table to store user images (uploaded and generated)
CREATE TABLE public.user_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('uploaded', 'generated')),
  filename TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  prompt TEXT, -- For AI-generated images
  model TEXT, -- For AI-generated images
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own images" 
ON public.user_images 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images" 
ON public.user_images 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" 
ON public.user_images 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" 
ON public.user_images 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_images_user_id ON public.user_images(user_id);
CREATE INDEX idx_user_images_source_type ON public.user_images(source_type);
CREATE INDEX idx_user_images_created_at ON public.user_images(created_at DESC);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_user_images_updated_at
BEFORE UPDATE ON public.user_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();