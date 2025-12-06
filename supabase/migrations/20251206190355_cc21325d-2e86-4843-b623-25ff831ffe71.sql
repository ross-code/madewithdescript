-- Add status column for approval workflow
ALTER TABLE public.projects 
ADD COLUMN status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing projects to approved status
UPDATE public.projects SET status = 'approved' WHERE status = 'pending';

-- Drop the authenticated-only insert policy
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;

-- Create policy allowing anyone to insert projects (for anonymous submissions)
CREATE POLICY "Anyone can insert projects"
ON public.projects
FOR INSERT
WITH CHECK (true);

-- Only show approved projects to the public
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;

CREATE POLICY "Public can view approved projects"
ON public.projects
FOR SELECT
USING (status = 'approved' OR has_role(auth.uid(), 'admin'));

-- Drop the authenticated-only storage policy
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;

-- Allow anyone to upload images for submissions
CREATE POLICY "Anyone can upload project images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'project-images');