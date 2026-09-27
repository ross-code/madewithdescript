import { Button } from '@/components/ui/button';
import { ArrowDown, Plus } from 'lucide-react';
import { Project } from '@/types/project';

interface HeroProps {
  onSubmitClick: () => void;
  projectCount: number;
  projects: Project[];
}

export const Hero = ({ onSubmitClick, projectCount, projects }: HeroProps) => {
  // Featured projects first, then the most recent, for the mosaic
  const mosaic = [...projects]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .slice(0, 9);

  return (
    <section className="container mx-auto px-4 pb-16 pt-14 md:pb-24 md:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="animate-slide-up">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
            A community directory&nbsp;·&nbsp;
            <span className="text-foreground">{projectCount} projects</span>
          </p>

          <h1 className="mb-6 font-serif text-[3.25rem] font-normal leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-[5.5rem]">
            Podcasts, channels &amp; courses{' '}
            <em className="text-accent">made with Descript.</em>
          </h1>

          <p className="mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Browse real work from creators who edit with Descript, then add your own.
            Submissions are free and reviewed before they go live.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={onSubmitClick}>
              <Plus />
              Submit your project
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Browse the directory
              <ArrowDown />
            </Button>
          </div>
        </div>

        {mosaic.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4" aria-hidden="true">
            {mosaic.map((project, i) => (
              <div
                key={project.id}
                className="aspect-square overflow-hidden rounded-lg border border-border bg-card animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
              >
                <img src={project.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
