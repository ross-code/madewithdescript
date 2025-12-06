import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProjectGrid } from '@/components/ProjectGrid';
import { SubmitProjectModal } from '@/components/SubmitProjectModal';
import { ContactForm } from '@/components/ContactForm';
import { Footer } from '@/components/Footer';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCategory } from '@/types/project';
import { Loader2, MessageCircle } from 'lucide-react';

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
  }) => {
    await addProject(newProject);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSubmitClick={() => setIsModalOpen(true)} />
      
      <main className="pt-16">
        <Hero 
          onSubmitClick={() => setIsModalOpen(true)} 
          projectCount={projects.length}
        />

        <section id="projects" className="container mx-auto px-4 py-16">
          <div className="space-y-8">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryCounts={categoryCounts}
            />

            <ProjectGrid projects={filteredProjects} />
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border mb-4">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Get in Touch</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
                Have Questions?
              </h2>
              <p className="text-muted-foreground">
                We'd love to hear from you. Send us a message and we'll respond as soon as possible.
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
