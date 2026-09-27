import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onSubmitClick: () => void;
}

export const Logo = () => (
  <span className="flex items-center gap-2.5">
    <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <rect x="2" y="6" width="2" height="4" rx="1" />
        <rect x="5.5" y="3" width="2" height="10" rx="1" />
        <rect x="9" y="5" width="2" height="6" rx="1" />
        <rect x="12.5" y="7" width="1.5" height="2" rx="0.75" />
      </svg>
    </span>
    <span className="font-medium tracking-tight text-foreground">
      Made with <span className="font-serif italic text-lg">Descript</span>
    </span>
  </span>
);

export const Header = ({ onSubmitClick }: HeaderProps) => {
  const { isAdmin } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" aria-label="Made with Descript home">
          <Logo />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <a href="#projects" className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
            Directory
          </a>
          <a href="#contact" className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block">
            Contact
          </a>
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <Settings />
                Admin
              </Button>
            </Link>
          )}
          <Button size="sm" onClick={onSubmitClick}>
            <Plus />
            <span className="sm:hidden">Submit</span>
            <span className="hidden sm:inline">Submit a project</span>
          </Button>
        </nav>
      </div>
    </header>
  );
};
