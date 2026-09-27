import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface HowItWorksProps {
  onSubmitClick: () => void;
}

const steps = [
  {
    title: 'Send it in',
    body: 'Share a link, a short description, and a cover image. It takes about two minutes.',
  },
  {
    title: 'We take a look',
    body: "Every submission is reviewed before it's published, so the directory stays useful.",
  },
  {
    title: 'Get discovered',
    body: 'Once approved, your project shows up here for other creators to find.',
  },
];

export const HowItWorks = ({ onSubmitClick }: HowItWorksProps) => {
  return (
    <section className="container mx-auto px-4 pb-16 md:pb-24">
      <div className="rounded-2xl bg-foreground px-6 py-12 text-background md:px-12 md:py-16">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-background/50">Get featured</p>
            <h2 className="max-w-xl font-serif text-4xl font-normal leading-[1.05] md:text-6xl">
              Made something with Descript?
            </h2>
          </div>
          <Button
            size="lg"
            onClick={onSubmitClick}
            className="bg-background text-foreground hover:bg-background/90 md:shrink-0"
          >
            <Plus />
            Submit your project
          </Button>
        </div>

        <ol className="grid gap-8 border-t border-background/15 pt-8 md:grid-cols-3 md:gap-10">
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="mb-3 block font-mono text-xs text-accent">0{i + 1}</span>
              <h3 className="mb-2 text-base font-medium">{step.title}</h3>
              <p className="text-sm leading-relaxed text-background/60">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
