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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectCategory, ProjectStatus, categoryLabels, statusLabels, statusColors } from '@/types/project';
import { ContactSubmissions } from '@/components/admin/ContactSubmissions';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { toast } from 'sonner';
import { 
  Loader2, Pencil, Trash2, Star, ArrowLeft, LogOut, 
  Search, Filter, ArrowUpDown, X, ExternalLink, Check, XCircle, Clock, FolderOpen, Mail, Copy, Download, Upload, FileSpreadsheet, Settings
} from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useDataExport } from '@/hooks/useDataExport';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

const sortLabels: Record<SortOption, string> = {
  'newest': 'Newest First',
  'oldest': 'Oldest First',
  'name-asc': 'Name A-Z',
  'name-desc': 'Name Z-A',
};

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { projects, isLoading: projectsLoading, updateProject, deleteProject } = useProjects();
  const { uploadImage, isUploading } = useImageUpload();
  const { exportProjectsToCSV } = useDataExport();
  const navigate = useNavigate();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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
    
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
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
  }, [projects, searchQuery, categoryFilter, statusFilter, sortBy]);

  const pendingCount = projects.filter(p => p.status === 'pending').length;
  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
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

  const handleBulkStatusChange = async (status: ProjectStatus) => {
    if (selectedIds.size === 0) return;
    
    try {
      await Promise.all([...selectedIds].map(id => updateProject(id, { status })));
      toast.success(`${status === 'approved' ? 'Approved' : 'Rejected'} ${selectedIds.size} project(s)`);
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

  const handleStatusChange = async (project: Project, status: ProjectStatus) => {
    try {
      await updateProject(project.id, { status });
      toast.success(`Project ${status === 'approved' ? 'approved' : 'rejected'}!`);
    } catch {
      toast.error('Failed to update status');
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
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="glass border border-border">
            <TabsTrigger value="projects" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              Projects
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <Mail className="w-4 h-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {/* Pending Alert */}
            {pendingCount > 0 && (
              <div className="glass border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-600 font-medium">
                  {pendingCount} project{pendingCount > 1 ? 's' : ''} awaiting review
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto border-yellow-600/30 text-yellow-600 hover:bg-yellow-600/10"
                  onClick={() => setStatusFilter('pending')}
                >
                  View Pending
                </Button>
              </div>
            )}

            {/* Search and Filters */}
            <div className="glass border border-border rounded-lg p-4 space-y-4">
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
                
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <SelectTrigger className="w-[150px] glass border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="glass border-border">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
            <div className="flex items-center justify-between flex-wrap gap-3">
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
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Export buttons - always visible when no selection */}
                {selectedIds.size === 0 && (
                  <>
                    {filteredProjects.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportProjectsToCSV(filteredProjects as unknown as Record<string, unknown>[])}
                      >
                        <FileSpreadsheet className="w-3 h-3 mr-1" /> Export CSV
                      </Button>
                    )}
                    {filteredProjects.some(p => p.submitterEmail) && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const emails = filteredProjects
                              .filter(p => p.submitterEmail)
                              .map(p => p.submitterEmail)
                              .join(', ');
                            navigator.clipboard.writeText(emails);
                            toast.success(`Copied ${filteredProjects.filter(p => p.submitterEmail).length} email(s)`);
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy Emails
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const emails = filteredProjects
                              .filter(p => p.submitterEmail)
                              .map(p => p.submitterEmail)
                              .join('\n');
                            const blob = new Blob([emails], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'project-submitter-emails.txt';
                            a.click();
                            URL.revokeObjectURL(url);
                            toast.success(`Downloaded ${filteredProjects.filter(p => p.submitterEmail).length} email(s)`);
                          }}
                        >
                          <Download className="w-3 h-3 mr-1" /> Emails
                        </Button>
                      </>
                    )}
                  </>
                )}
                
                {/* Bulk action buttons - visible when items selected */}
                {selectedIds.size > 0 && (
                  <>
                    <Button variant="outline" size="sm" className="text-green-600 border-green-600/30 hover:bg-green-600/10" onClick={() => handleBulkStatusChange('approved')}>
                      <Check className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-600/30 hover:bg-red-600/10" onClick={() => handleBulkStatusChange('rejected')}>
                      <XCircle className="w-3 h-3 mr-1" /> Reject
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBulkToggleFeatured(true)}>
                      <Star className="w-3 h-3 mr-1" /> Feature
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </>
                )}
              </div>
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
                        <Badge className={`text-xs ${statusColors[project.status || 'pending']}`}>
                          {project.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {project.status === 'approved' && <Check className="w-3 h-3 mr-1" />}
                          {project.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {statusLabels[project.status || 'pending']}
                        </Badge>
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
                      {project.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusChange(project, 'approved')}
                            title="Approve"
                            className="text-green-600 hover:text-green-700 hover:bg-green-600/10"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStatusChange(project, 'rejected')}
                            title="Reject"
                            className="text-red-600 hover:text-red-700 hover:bg-red-600/10"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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
          </TabsContent>

          <TabsContent value="messages">
            <ContactSubmissions />
          </TabsContent>
        </Tabs>
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
              <Label htmlFor="edit-imageUrl">Image</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="glass border-border flex-1"
                  placeholder="Image URL"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await uploadImage(file);
                        if (url) {
                          setFormData(prev => ({ ...prev, imageUrl: url }));
                          toast.success('Image uploaded!');
                        }
                      }
                      e.target.value = '';
                    }}
                    disabled={isUploading}
                  />
                  <Button type="button" variant="outline" disabled={isUploading} asChild>
                    <span>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </span>
                  </Button>
                </label>
              </div>
              {formData.imageUrl && (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg mt-2" />
              )}
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