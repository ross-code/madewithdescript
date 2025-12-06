import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-foreground">Made With Descript</span>
          </div>

          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            Made with <Heart className="w-4 h-4 text-primary fill-primary" /> by{' '}
            <a 
              href="https://descriptmastery.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Descript Mastery
            </a>
          </p>

          <div className="flex items-center gap-6">
            <a 
              href="https://www.youtube.com/@DescriptMastery" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              YouTube
            </a>
            <a 
              href="https://descript.cello.so/bSaCOWa8OrH" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Get Descript
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
