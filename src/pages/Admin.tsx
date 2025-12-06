import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectCategory, categoryLabels } from '@/types/project';
import { toast } from 'sonner';
import { Loader2, Pencil, Trash2, Star, ArrowLeft, LogOut } from 'lucide-react';

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { projects, isLoading: projectsLoading, updateProject, deleteProject } = useProjects();
  const navigate = useNavigate();
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    imageUrl: '',
    category: '' as ProjectCategory | '',
    featured: false,
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      url: project.url,
      imageUrl: project.imageUrl,
      category: project.category,
      featured: project.featured || false,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setIsSubmitting(true);
    try {
      await updateProject(editingProject.id, {
        name: formData.name,
        description: formData.description,
        url: formData.url,
        imageUrl: formData.imageUrl,
        category: formData.category as ProjectCategory,
        featured: formData.featured,
      });
      toast.success('Project updated!');
      setEditingProject(null);
    } catch {
      toast.error('Failed to update project');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"?`)) return;

    try {
      await deleteProject(project.id);
      toast.success('Project deleted!');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const toggleFeatured = async (project: Project) => {
    try {
      await updateProject(project.id, { featured: !project.featured });
      toast.success(project.featured ? 'Removed from featured' : 'Added to featured');
    } catch {
      toast.error('Failed to update');
    }
  };

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-xl font-bold gradient-text">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-semibold text-foreground">
            Manage Projects ({projects.length})
          </h2>
        </div>

        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass border border-border rounded-lg p-4 flex items-center gap-4"
            >
              <img
                src={project.imageUrl}
                alt={project.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                  {project.featured && <Star className="w-4 h-4 text-primary fill-primary" />}
                </div>
                <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                <span className="text-xs text-muted-foreground">{categoryLabels[project.category]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFeatured(project)}
                  title={project.featured ? 'Remove featured' : 'Make featured'}
                >
                  <Star className={`w-4 h-4 ${project.featured ? 'text-primary fill-primary' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEditModal(project)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(project)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="sm:max-w-lg glass border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl gradient-text">Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="glass border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="glass border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">URL</Label>
              <Input
                id="edit-url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="glass border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="glass border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as ProjectCategory }))}
              >
                <SelectTrigger className="glass border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-border">
                  {(Object.keys(categoryLabels) as ProjectCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-featured"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="edit-featured">Featured</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setEditingProject(null)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;