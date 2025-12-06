-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true);

-- Allow anyone to view project images (public bucket)
CREATE POLICY "Public can view project images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-images');

-- Allow anyone to upload project images (for submissions)
CREATE POLICY "Anyone can upload project images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'project-images');