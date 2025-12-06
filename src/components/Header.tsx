import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  onSubmitClick: () => void;
}

export const Header = ({ onSubmitClick }: HeaderProps) => {
  const { isAdmin } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
              Made With Descript
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="default" size="sm" onClick={onSubmitClick}>
              <Plus className="w-4 h-4" />
              Submit
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
