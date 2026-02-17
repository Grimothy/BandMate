import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Archive, Music } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjects } from '../api/projects';
import { Project } from '../types';
import { Card, CardImage } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { DashboardActivityCard } from '../components/dashboard/DashboardActivityCard';

export function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Section with Stat Badges */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted mt-1">
          Here's an overview of your music projects
        </p>
        
        {/* Stat Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <FolderOpen className="w-4 h-4" />
            <span className="font-bold">{projects.length}</span>
            Projects
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <Archive className="w-4 h-4" />
            <span className="font-bold">
              {projects.reduce((acc, p) => acc + (p.vibes?.length || 0), 0)}
            </span>
            Vibes
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <Music className="w-4 h-4" />
            <span className="font-bold">
              {projects.reduce((acc, p) => 
                acc + (p.vibes?.reduce((vacc, v) => vacc + (v.cuts?.length || 0), 0) || 0), 0
              )}
            </span>
            Cuts
          </span>
        </div>
      </div>

      {/* Activity Section - Full Width */}
      <DashboardActivityCard />

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">Recent Projects</h2>
          <Link
            to="/projects"
            className="text-primary hover:text-primary-hover transition-colors text-sm font-medium"
          >
            View all
          </Link>
        </div>

        {isLoading ? (
          <Loading className="py-12" />
        ) : projects.length === 0 ? (
          <Card className="text-center py-12">
            <svg className="w-12 h-12 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-muted">No projects yet</p>
            {user?.role === 'ADMIN' && (
              <Link
                to="/projects"
                className="text-primary hover:underline text-sm mt-2 inline-block"
              >
                Create your first project
              </Link>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card hoverable>
                  <CardImage src={project.image} alt={project.name} />
                  <h3 className="mt-3 font-semibold text-text">{project.name}</h3>
                  <p className="text-sm text-muted">
                    {project.members?.length || 0} members • {project.vibes?.length || 0} vibes
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
