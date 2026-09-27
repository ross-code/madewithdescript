import { cn } from '@/lib/utils';
import { ProjectCategory, categoryLabels } from '@/types/project';

interface CategoryFilterProps {
  selectedCategory: ProjectCategory | 'all';
  onCategoryChange: (category: ProjectCategory | 'all') => void;
  categoryCounts: Record<ProjectCategory | 'all', number>;
}

const categories: (ProjectCategory | 'all')[] = ['all', 'podcast', 'youtube', 'course', 'tool', 'other'];

export const CategoryFilter = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}: CategoryFilterProps) => {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div role="tablist" aria-label="Filter by category" className="flex w-max gap-1.5">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          const count = categoryCounts[category];
          if (category !== 'all' && count === 0) return null;

          return (
            <button
              key={category}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onCategoryChange(category)}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
                isSelected
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground'
              )}
            >
              {category === 'all' ? 'All' : categoryLabels[category]}
              <span className={cn('font-mono text-[11px]', isSelected ? 'text-background/60' : 'text-muted-foreground/70')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
