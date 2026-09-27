import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ProjectCategory, categoryLabels } from '@/types/project';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Upload, Link, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SubmitProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: {
    name: string;
    description: string;
    url: string;
    imageUrl: string;
    category: ProjectCategory;
    submitterEmail?: string;
    consentPublicPosting?: boolean;
  }) => Promise<void>;
}

export const SubmitProjectModal = ({ isOpen, onClose, onSubmit }: SubmitProjectModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    imageUrl: '',
    category: '' as ProjectCategory | '',
    email: '',
    consentPublicPosting: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.url || !formData.category || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.consentPublicPosting) {
      toast.error('Please consent to the public posting of your project');
      return;
    }

    setIsSubmitting(true);
    
    let finalImageUrl = formData.imageUrl;
    
    // Upload file if one was selected
    if (uploadedFile) {
      setIsUploading(true);
      const uploadedUrl = await uploadImage(uploadedFile);
      setIsUploading(false);
      
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      } else {
        toast.error('Failed to upload image. Using default image instead.');
      }
    }
    
    // Use default image if no image provided
    if (!finalImageUrl) {
      finalImageUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop`;
    }
    
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description,
        url: formData.url,
        imageUrl: finalImageUrl,
        category: formData.category as ProjectCategory,
        submitterEmail: formData.email,
        consentPublicPosting: formData.consentPublicPosting,
      });
    } catch {
      setIsSubmitting(false);
      toast.error('Something went wrong submitting your project. Please try again.');
      return;
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      setFormData({ name: '', description: '', url: '', imageUrl: '', category: '', email: '', consentPublicPosting: false });
      clearUploadedFile();
      setImageMode('upload');
      setIsSuccess(false);
      onClose();
      toast.success('Project submitted! It will appear after admin approval.');
    }, 1500);
  };

  const handleClose = () => {
    clearUploadedFile();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-card">
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-3xl font-normal tracking-tight">
            Submit your project
          </DialogTitle>
          <DialogDescription>
            Tell us what you made with Descript. We review every submission before it goes live.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-secondary flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-serif text-3xl font-normal text-foreground mb-2">
              Thanks, it's in
            </h3>
            <p className="text-muted-foreground">
              Your project has been submitted for review. Once approved, it will appear on the showcase.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Awesome Project"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell us about your project..."
                className="bg-background min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Project URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="bg-background"
              />
            </div>

            <div className="space-y-3">
              <Label>Project Image (optional)</Label>
              
              {/* Toggle between upload and URL */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={imageMode === 'upload' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setImageMode('upload');
                    setFormData(prev => ({ ...prev, imageUrl: '' }));
                  }}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant={imageMode === 'url' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setImageMode('url');
                    clearUploadedFile();
                  }}
                  className="flex-1"
                >
                  <Link className="w-4 h-4 mr-2" />
                  URL
                </Button>
              </div>

              {imageMode === 'upload' ? (
                <div className="space-y-3">
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 w-8 h-8"
                        onClick={clearUploadedFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-input bg-background rounded-lg p-6 text-center cursor-pointer hover:border-foreground/40 transition-colors"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload an image
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 5MB, JPG/PNG/GIF
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="bg-background"
                  />
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Leave empty for a default image
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as ProjectCategory }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabels) as ProjectCategory[]).map((category) => (
                    <SelectItem key={category} value={category}>
                      {categoryLabels[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Your Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                We'll use this to notify you about your submission status
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-secondary/50">
              <Checkbox
                id="consent"
                checked={formData.consentPublicPosting}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consentPublicPosting: checked === true }))}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <Label htmlFor="consent" className="text-sm font-medium cursor-pointer">
                  I consent to the public posting of my project *
                </Label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, you agree that your project name, description, URL, and image may be publicly displayed on this showcase.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="flex-1"
              >
                {isSubmitting || isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isUploading ? 'Uploading...' : 'Submitting...'}
                  </>
                ) : (
                  'Submit project'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
