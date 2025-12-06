import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProjectGrid } from '@/components/ProjectGrid';
import { SubmitProjectModal } from '@/components/SubmitProjectModal';
import { Footer } from '@/components/Footer';
import { sampleProjects } from '@/data/sampleProjects';
import { Project, ProjectCategory } from '@/types/project';

const Index = () => {
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
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

  const handleSubmitProject = (newProject: {
    name: string;
    description: string;
    url: string;
    imageUrl: string;
    category: ProjectCategory;
  }) => {
    const project: Project = {
      id: Date.now().toString(),
      ...newProject,
      createdAt: new Date(),
    };
    
    setProjects((prev) => [project, ...prev]);
  };

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
