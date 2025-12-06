import { cn } from '@/lib/utils';
import { ProjectCategory, categoryLabels } from '@/types/project';
import { Mic, Youtube, GraduationCap, Wrench, Layers } from 'lucide-react';

const categoryIcons: Record<ProjectCategory | 'all', React.ReactNode> = {
  all: <Layers className="w-4 h-4" />,
  podcast: <Mic className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  course: <GraduationCap className="w-4 h-4" />,
  tool: <Wrench className="w-4 h-4" />,
  other: <Layers className="w-4 h-4" />,
};

interface CategoryFilterProps {
  selectedCategory: ProjectCategory | 'all';
  onCategoryChange: (category: ProjectCategory | 'all') => void;
  categoryCounts: Record<ProjectCategory | 'all', number>;
}

export const CategoryFilter = ({ 
  selectedCategory, 
  onCategoryChange,
  categoryCounts 
}: CategoryFilterProps) => {
  const categories: (ProjectCategory | 'all')[] = ['all', 'podcast', 'youtube', 'course', 'tool', 'other'];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        const count = categoryCounts[category];
        
        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
              isSelected
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "glass text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            {categoryIcons[category]}
            <span>{category === 'all' ? 'All Projects' : categoryLabels[category]}</span>
            <span className={cn(
              "px-2 py-0.5 rounded-md text-xs",
              isSelected ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
