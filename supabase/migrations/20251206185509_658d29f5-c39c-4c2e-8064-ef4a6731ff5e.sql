-- Drop the existing permissive storage upload policy
DROP POLICY IF EXISTS "Anyone can upload project images" ON storage.objects;

-- Create a secure policy requiring authentication for uploads
CREATE POLICY "Authenticated users can upload project images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

-- Also update the projects table insert policy to require authentication
DROP POLICY IF EXISTS "Anyone can insert projects" ON public.projects;

CREATE POLICY "Authenticated users can insert projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);