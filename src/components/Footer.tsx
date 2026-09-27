import { Logo } from './Header';

export const Footer = () => {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto flex flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <Logo />

        <p className="text-sm text-muted-foreground">
          A community project by{' '}
          <a
            href="https://descriptmastery.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            Descript Mastery
          </a>
          .
        </p>

        <div className="flex items-center gap-6 text-sm">
          <a
            href="https://www.youtube.com/@DescriptMastery"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            YouTube
          </a>
          <a
            href="https://descript.cello.so/bSaCOWa8OrH"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Get Descript
          </a>
        </div>
      </div>
    </footer>
  );
};
