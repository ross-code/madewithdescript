import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';

interface HeaderProps {
  onSubmitClick: () => void;
}

export const Header = ({ onSubmitClick }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
              Showcase
            </span>
          </a>

          <Button variant="default" size="sm" onClick={onSubmitClick}>
            <Plus className="w-4 h-4" />
            Submit
          </Button>
        </div>
      </div>
    </header>
  );
};
