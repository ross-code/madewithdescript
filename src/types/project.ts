export type ProjectCategory = 'podcast' | 'youtube' | 'course' | 'tool' | 'other';
export type ProjectStatus = 'pending' | 'approved' | 'rejected';

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  imageUrl: string;
  category: ProjectCategory;
  createdAt: Date;
  featured?: boolean;
  status?: ProjectStatus;
  submitterEmail?: string;
  consentPublicPosting?: boolean;
}

export const categoryLabels: Record<ProjectCategory, string> = {
  podcast: 'Podcast',
  youtube: 'YouTube',
  course: 'Course',
  tool: 'Tool',
  other: 'Other',
};

export const categoryColors: Record<ProjectCategory, string> = {
  podcast: 'bg-category-podcast',
  youtube: 'bg-category-youtube',
  course: 'bg-category-course',
  tool: 'bg-category-tool',
  other: 'bg-category-other',
};

export const statusLabels: Record<ProjectStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const statusColors: Record<ProjectStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-600',
  approved: 'bg-green-500/20 text-green-600',
  rejected: 'bg-red-500/20 text-red-600',
};