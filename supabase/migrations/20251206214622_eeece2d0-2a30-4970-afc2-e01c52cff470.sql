-- Add email and consent fields to projects table
ALTER TABLE public.projects ADD COLUMN submitter_email text;
ALTER TABLE public.projects ADD COLUMN consent_public_posting boolean NOT NULL DEFAULT false;