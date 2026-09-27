import { Project } from '@/types/project';
import { ProjectCard } from './ProjectCard';
import { SearchX } from 'lucide-react';

interface ProjectGridProps {
  projects: Project[];
}

export const ProjectGrid = ({ projects }: ProjectGridProps) => {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-20 text-center">
        <SearchX className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
        <h3 className="mb-1 font-serif text-2xl font-normal text-foreground">Nothing here yet</h3>
        <p className="text-sm text-muted-foreground">
          Try a different search or category, or be the first to submit one.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  );
};
