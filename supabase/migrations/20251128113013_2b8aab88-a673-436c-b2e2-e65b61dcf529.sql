-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations (public access for now - you can restrict later)
CREATE POLICY "Anyone can view conversations" 
ON public.conversations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create conversations" 
ON public.conversations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update conversations" 
ON public.conversations 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete conversations" 
ON public.conversations 
FOR DELETE 
USING (true);

-- RLS Policies for messages
CREATE POLICY "Anyone can view messages" 
ON public.messages 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update messages" 
ON public.messages 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete messages" 
ON public.messages 
FOR DELETE 
USING (true);

-- Indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- Trigger to update updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();