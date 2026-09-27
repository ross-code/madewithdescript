import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProjectGrid } from '@/components/ProjectGrid';
import { SubmitProjectModal } from '@/components/SubmitProjectModal';
import { ContactForm } from '@/components/ContactForm';
import { Footer } from '@/components/Footer';
import { HowItWorks } from '@/components/HowItWorks';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCategory } from '@/types/project';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { projects, isLoading, addProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [projects, searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<ProjectCategory | 'all', number> = {
      all: projects.length,
      podcast: 0,
      youtube: 0,
      course: 0,
      tool: 0,
      other: 0,
    };

    projects.forEach((project) => {
      counts[project.category]++;
    });

    return counts;
  }, [projects]);

  const handleSubmitProject = async (newProject: {
    name: string;
    description: string;
    url: string;
    imageUrl: string;
    category: ProjectCategory;
    submitterEmail?: string;
    consentPublicPosting?: boolean;
  }) => {
    await addProject(newProject);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openSubmit = () => setIsModalOpen(true);

  return (
    <div className="min-h-screen bg-background">
      <Header onSubmitClick={openSubmit} />

      <main className="pt-16">
        <Hero onSubmitClick={openSubmit} projectCount={projects.length} projects={projects} />

        <section id="projects" className="scroll-mt-16 border-t border-border">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <h2 className="font-serif text-4xl font-normal md:text-5xl">The directory</h2>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground" aria-live="polite">
                Showing {filteredProjects.length} of {projects.length}
              </p>
            </div>

            <div className="sticky top-16 z-30 -mx-4 mb-10 flex flex-col gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categoryCounts={categoryCounts}
              />
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            <ProjectGrid projects={filteredProjects} />
          </div>
        </section>

        <HowItWorks onSubmitClick={openSubmit} />

        <section id="contact" className="scroll-mt-16 border-t border-border">
          <div className="container mx-auto grid gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Contact</p>
              <h2 className="mb-4 font-serif text-4xl font-normal md:text-5xl">Questions?</h2>
              <p className="max-w-sm leading-relaxed text-muted-foreground">
                Want to update a listing, report a broken link, or just say hi? Send a note and we'll get back to you.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />

      <SubmitProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitProject}
      />
    </div>
  );
};

export default Index;
