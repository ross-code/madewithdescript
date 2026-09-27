import { useState, useEffect, useCallback } from 'react';
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
  status: string;
}

interface DbProjectSubmission {
  project_id: string;
  submitter_email: string | null;
  consent_public_posting: boolean;
}

const mapDbToProject = (db: DbProject, submission?: DbProjectSubmission): Project => ({
  id: db.id,
  name: db.name,
  description: db.description,
  url: db.url,
  imageUrl: getProjectImage(db.name, db.image_url),
  category: db.category as ProjectCategory,
  featured: db.featured,
  createdAt: new Date(db.created_at),
  status: db.status as 'pending' | 'approved' | 'rejected',
  submitterEmail: submission?.submitter_email || undefined,
  consentPublicPosting: submission?.consent_public_posting,
});

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      setIsLoading(false);
      return;
    }

    // Try to fetch submission data (will only succeed for admins due to RLS)
    const { data: submissions } = await supabase
      .from('project_submissions')
      .select('project_id, submitter_email, consent_public_posting');

    const submissionMap = new Map<string, DbProjectSubmission>();
    if (submissions) {
      submissions.forEach((s: DbProjectSubmission) => {
        submissionMap.set(s.project_id, s);
      });
    }

    setProjects((data as DbProject[]).map(db => mapDbToProject(db, submissionMap.get(db.id))));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();

    // Re-fetch when auth state changes (so admin can see submission data)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProjects();
    });

    return () => subscription.unsubscribe();
  }, [fetchProjects]);

  const addProject = async (project: Omit<Project, 'id' | 'createdAt' | 'status'>) => {
    // Generate the id client-side: anonymous submitters can't SELECT pending
    // rows under RLS, so insert(...).select() would fail for them.
    const id = crypto.randomUUID();
    const { error } = await supabase
      .from('projects')
      .insert({
        id,
        name: project.name,
        description: project.description,
        url: project.url,
        image_url: project.imageUrl,
        category: project.category,
        featured: project.featured || false,
        status: 'pending',
      });

    if (error) {
      console.error('Error adding project:', error);
      throw error;
    }

    // Insert PII into separate table
    if (project.submitterEmail) {
      const { error: subError } = await supabase
        .from('project_submissions')
        .insert({
          project_id: id,
          submitter_email: project.submitterEmail,
          consent_public_posting: project.consentPublicPosting || false,
        });

      if (subError) {
        console.error('Error saving submission details:', subError);
      }
    }

    // Send notification email
    try {
      await supabase.functions.invoke('notify-submission', {
        body: {
          projectName: project.name,
          projectDescription: project.description,
          projectUrl: project.url,
          projectCategory: project.category,
          projectId: id,
          submitterEmail: project.submitterEmail,
          imageUrl: project.imageUrl,
        },
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    // Forward to webhook (Zapier, Make, etc.)
    try {
      await supabase.functions.invoke('forward-submission-webhook', {
        body: {
          projectName: project.name,
          projectDescription: project.description,
          projectUrl: project.url,
          projectCategory: project.category,
          projectId: id,
          submitterEmail: project.submitterEmail,
          imageUrl: project.imageUrl,
        },
      });
    } catch (webhookError) {
      console.error('Failed to forward to webhook:', webhookError);
    }

    return id;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.url !== undefined) dbUpdates.url = updates.url;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.featured !== undefined) dbUpdates.featured = updates.featured;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

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
