
-- Create project_submissions table for PII (admin-only access)
CREATE TABLE public.project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submitter_email text,
  consent_public_posting boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT
CREATE POLICY "Admins can view project submissions"
  ON public.project_submissions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert (needed for public project submission)
CREATE POLICY "Anyone can insert project submissions"
  ON public.project_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admin-only DELETE
CREATE POLICY "Admins can delete project submissions"
  ON public.project_submissions
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing data
INSERT INTO public.project_submissions (project_id, submitter_email, consent_public_posting, created_at)
SELECT id, submitter_email, consent_public_posting, created_at
FROM public.projects
WHERE submitter_email IS NOT NULL;

-- Drop PII columns from projects
ALTER TABLE public.projects DROP COLUMN submitter_email;
ALTER TABLE public.projects DROP COLUMN consent_public_posting;
