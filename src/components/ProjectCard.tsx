import { Project, categoryLabels } from '@/types/project';
import { ExternalLink, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const categoryColorClasses: Record<string, string> = {
  podcast: 'bg-category-podcast/20 text-category-podcast border-category-podcast/30',
  youtube: 'bg-category-youtube/20 text-category-youtube border-category-youtube/30',
  course: 'bg-category-course/20 text-category-course border-category-course/30',
  tool: 'bg-category-tool/20 text-category-tool border-category-tool/30',
  other: 'bg-category-other/20 text-category-other border-category-other/30',
};

export const ProjectCard = ({ project, index }: ProjectCardProps) => {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <article className="relative h-full rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover glass">
        {/* Featured badge */}
        {project.featured && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg">
            <Star className="w-3 h-3 fill-current" />
            Featured
          </div>
        )}

        {/* Image container */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={project.imageUrl}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="p-3 rounded-full bg-primary text-primary-foreground shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {project.name}
            </h3>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {project.description}
          </p>

          <div className="flex items-center justify-between">
            <span className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium border",
              categoryColorClasses[project.category]
            )}>
              {categoryLabels[project.category]}
            </span>
            
            <span className="text-xs text-muted-foreground">
              {project.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </article>
    </a>
  );
};
