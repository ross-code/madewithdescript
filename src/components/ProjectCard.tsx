import { Project, categoryLabels } from '@/types/project';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const categoryDotClasses: Record<string, string> = {
  podcast: 'bg-category-podcast',
  youtube: 'bg-category-youtube',
  course: 'bg-category-course',
  tool: 'bg-category-tool',
  other: 'bg-category-other',
};

export const ProjectCard = ({ project, index }: ProjectCardProps) => {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block animate-fade-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms`, animationFillMode: 'both' }}
    >
      <article className="flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-300 group-hover:shadow-card-hover">
          <img
            src={project.imageUrl}
            alt={project.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
          {project.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground shadow-sm">
              Featured
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col pt-4">
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-base font-medium text-foreground">
              {project.name}
            </h3>
            <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>

          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>

          <div className="mt-auto flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <span className={cn('h-1.5 w-1.5 rounded-full', categoryDotClasses[project.category])} />
            <span className="text-foreground/80">{categoryLabels[project.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{project.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </article>
    </a>
  );
};
