import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectCategory } from '@/types/project';
import { toast } from 'sonner';
import { getProjectImage } from '@/data/projectImages';

interface DbProject {
  id: string;
  name: string;
  description: string;
  url: string;
  image_url: string;
  category: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

const mapDbToProject = (db: DbProject): Project => ({
  id: db.id,
  name: db.name,
  description: db.description,
  url: db.url,
  imageUrl: getProjectImage(db.name, db.image_url),
  category: db.category as ProjectCategory,
  featured: db.featured,
  createdAt: new Date(db.created_at),
});

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      return;
    }

    setProjects((data as DbProject[]).map(mapDbToProject));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: project.name,
        description: project.description,
        url: project.url,
        image_url: project.imageUrl,
        category: project.category,
        featured: project.featured || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
      throw error;
    }

    setProjects(prev => [mapDbToProject(data as DbProject), ...prev]);
    return data;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.featured !== undefined) dbUpdates.featured = updates.featured;

    const { error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }

    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }

    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
};