import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-muted mt-1">
          Here's an overview of your music projects
        </p>
      </div>

      {/* Stats and Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Section - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{projects.length}</p>
                  <p className="text-sm text-muted">Projects</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">
                    {projects.reduce((acc, p) => acc + (p.vibes?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-muted">Vibes</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">
                    {projects.reduce((acc, p) => 
                      acc + (p.vibes?.reduce((vacc, v) => vacc + (v.cuts?.length || 0), 0) || 0), 0
                    )}
                  </p>
                  <p className="text-sm text-muted">Cuts</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Activity Card - 1 column */}
        <div className="lg:col-span-1">
          <DashboardActivityCard />
        </div>
      </div>

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
