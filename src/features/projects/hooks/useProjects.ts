import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Cast to 'any' since 'projects' table was just added and types aren't regenerated yet
      const { data, error } = await (supabase
        .from('projects' as any)
        .select('*')
        .order('updated_at', { ascending: false }) as any);

      if (error) throw error;
      setProjects((data as Project[]) || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string): Promise<Project | null> => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to create projects',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await (supabase
        .from('projects' as any)
        .insert({ name, user_id: user.id })
        .select()
        .single() as any);

      if (error) throw error;

      setProjects(prev => [data as Project, ...prev]);
      toast({ title: 'Created', description: `Project "${name}" created` });
      return data as Project;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      return null;
    }
  };

  const renameProject = async (id: string, newName: string) => {
    try {
      const { error } = await (supabase
        .from('projects' as any)
        .update({ name: newName })
        .eq('id', id) as any);

      if (error) throw error;

      setProjects(prev =>
        prev.map(p => (p.id === id ? { ...p, name: newName } : p))
      );
      toast({ title: 'Renamed', description: `Project renamed to "${newName}"` });
    } catch (error) {
      console.error('Error renaming project:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename project',
        variant: 'destructive',
      });
    }
  };

  const deleteProject = async (id: string) => {
    const project = projects.find(p => p.id === id);
    
    try {
      const { error } = await (supabase
        .from('projects' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Deleted', description: `Project "${project?.name}" deleted` });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  const duplicateProject = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return null;

    return await createProject(`${project.name} (copy)`);
  };

  return {
    projects,
    isLoading,
    createProject,
    renameProject,
    deleteProject,
    duplicateProject,
    refreshProjects: fetchProjects,
  };
};
