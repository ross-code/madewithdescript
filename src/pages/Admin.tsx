import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectCategory, categoryLabels } from '@/types/project';
import { toast } from 'sonner';
import { 
  Loader2, Pencil, Trash2, Star, ArrowLeft, LogOut, 
  Search, Filter, ArrowUpDown, X, ExternalLink, Check
} from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

const sortLabels: Record<SortOption, string> = {
  'newest': 'Newest First',
  'oldest': 'Oldest First',
  'name-asc': 'Name A-Z',
  'name-desc': 'Name Z-A',
};

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { projects, isLoading: projectsLoading, updateProject, deleteProject } = useProjects();
  const navigate = useNavigate();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not-featured'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Edit modal state
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

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.url.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    // Featured filter
    if (featuredFilter === 'featured') {
      result = result.filter(p => p.featured);
    } else if (featuredFilter === 'not-featured') {
      result = result.filter(p => !p.featured);
    }
    
    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
    
    return result;
  }, [projects, searchQuery, categoryFilter, featuredFilter, sortBy]);

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || featuredFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setFeaturedFilter('all');
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} project(s)?`)) return;
    
    try {
      await Promise.all([...selectedIds].map(id => deleteProject(id)));
      toast.success(`Deleted ${selectedIds.size} project(s)`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to delete some projects');
    }
  };

  const handleBulkToggleFeatured = async (featured: boolean) => {
    if (selectedIds.size === 0) return;
    
    try {
      await Promise.all([...selectedIds].map(id => updateProject(id, { featured })));
      toast.success(`Updated ${selectedIds.size} project(s)`);
      setSelectedIds(new Set());
    } catch {
      toast.error('Failed to update some projects');
    }
  };

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
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-xl font-bold gradient-text">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="glass border border-border rounded-lg p-4 mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects by name, description, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-border"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          {/* Filter Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ProjectCategory | 'all')}>
              <SelectTrigger className="w-[140px] glass border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="glass border-border">
                <SelectItem value="all">All Categories</SelectItem>
                {(Object.keys(categoryLabels) as ProjectCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={featuredFilter} onValueChange={(v) => setFeaturedFilter(v as 'all' | 'featured' | 'not-featured')}>
              <SelectTrigger className="w-[140px] glass border-border">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent className="glass border-border">
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
                <SelectItem value="not-featured">Not Featured</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px] glass border-border">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="glass border-border">
                  {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
                    <SelectItem key={opt} value={opt}>{sortLabels[opt]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results Header + Bulk Actions */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={filteredProjects.length > 0 && selectedIds.size === filteredProjects.length}
              onCheckedChange={toggleSelectAll}
              disabled={filteredProjects.length === 0}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 
                ? `${selectedIds.size} selected` 
                : `${filteredProjects.length} project(s)`}
            </span>
          </div>
          
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkToggleFeatured(true)}>
                <Star className="w-3 h-3 mr-1" /> Feature
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkToggleFeatured(false)}>
                <Star className="w-3 h-3 mr-1 opacity-50" /> Unfeature
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-3 h-3 mr-1" /> Delete
              </Button>
            </div>
          )}
        </div>

        {/* Projects List */}
        <div className="space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="glass border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'No projects match your filters' : 'No projects yet'}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`glass border rounded-lg p-4 flex items-center gap-4 transition-colors ${
                  selectedIds.has(project.id) ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <Checkbox
                  checked={selectedIds.has(project.id)}
                  onCheckedChange={() => toggleSelect(project.id)}
                />
                <img
                  src={project.imageUrl}
                  alt={project.name}
                  className="w-14 h-14 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                    {project.featured && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{categoryLabels[project.category]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Visit
                    </a>
                    <span className="text-xs text-muted-foreground">
                      Added {project.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
            ))
          )}
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
              <Checkbox
                id="edit-featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
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