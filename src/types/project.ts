export type ProjectCategory = 'podcast' | 'youtube' | 'course' | 'tool' | 'other';

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  imageUrl: string;
  category: ProjectCategory;
  createdAt: Date;
  featured?: boolean;
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
