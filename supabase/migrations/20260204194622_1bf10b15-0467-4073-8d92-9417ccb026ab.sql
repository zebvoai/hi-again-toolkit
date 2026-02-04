-- Create projects table with user isolation
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add project_id to conversations (nullable - chats can exist without projects)
ALTER TABLE public.conversations 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create trigger for updating updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_conversations_project_id ON public.conversations(project_id);