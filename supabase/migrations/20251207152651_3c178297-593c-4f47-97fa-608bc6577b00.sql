-- Add file size limit (5MB) and allowed MIME types to project-images bucket
UPDATE storage.buckets SET 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'project-images';