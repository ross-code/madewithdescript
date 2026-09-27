import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onSubmitClick: () => void;
}

export const Logo = () => (
  <span className="flex items-center gap-2.5">
    <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="hsl(var(--foreground))" />
      <rect x="9.5" y="24" width="8" height="16" rx="4" fill="hsl(var(--background))" />
      <rect x="21.5" y="13" width="8" height="38" rx="4" fill="hsl(var(--accent))" />
      <rect x="33.5" y="19" width="8" height="26" rx="4" fill="hsl(var(--background))" />
      <rect x="45.5" y="26" width="8" height="12" rx="4" fill="hsl(var(--background))" />
    </svg>
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
