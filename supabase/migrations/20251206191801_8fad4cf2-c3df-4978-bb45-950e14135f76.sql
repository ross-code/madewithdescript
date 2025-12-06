-- First, drop all existing policies on projects table
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Public can view approved projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;

-- Recreate as PERMISSIVE policies (the default)
CREATE POLICY "Anyone can insert projects"
ON public.projects
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can view approved projects"
ON public.projects
FOR SELECT
TO public
USING (status = 'approved' OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));