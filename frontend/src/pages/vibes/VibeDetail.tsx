import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVibe, uploadVibeImage } from '../../api/vibes';
import { createCut, deleteCut } from '../../api/cuts';
import { Vibe } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardImage } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Loading } from '../../components/ui/Loading';

export function VibeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [vibe, setVibe] = useState<Vibe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCutModal, setShowCutModal] = useState(false);
  const [cutName, setCutName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchVibe = async () => {
    if (!id) return;
    try {
      const data = await getVibe(id);
      setVibe(data);
    } catch (error) {
      console.error('Failed to fetch vibe:', error);
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVibe();
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      await uploadVibeImage(id, file);
      fetchVibe();
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleCreateCut = async () => {
    if (!cutName.trim() || !id) {
      setError('Cut name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createCut(id, cutName);
      setCutName('');
      setShowCutModal(false);
      fetchVibe();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to create cut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCut = async (cutId: string) => {
    if (!confirm('Are you sure you want to delete this cut?')) return;
    try {
      await deleteCut(cutId);
      fetchVibe();
    } catch (error) {
      console.error('Failed to delete cut:', error);
    }
  };

  if (isLoading) {
    return <Loading className="py-12" />;
  }

  if (!vibe) {
    return (
      <Card className="text-center py-12">
        <p className="text-muted">Vibe not found</p>
        <Link to="/projects" className="text-primary hover:underline mt-2 inline-block">
          Back to projects
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted">
        <Link to="/projects" className="hover:text-text">Projects</Link>
        <span className="mx-2">/</span>
        <Link to={`/projects/${vibe.project?.id}`} className="hover:text-text">
          {vibe.project?.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text">{vibe.name}</span>
      </nav>

      {/* Vibe Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-64 flex-shrink-0">
          <CardImage src={vibe.image} alt={vibe.name} className="aspect-square" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 p-2 bg-surface/80 rounded-lg text-muted hover:text-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-text">{vibe.name}</h1>
          {vibe.theme && (
            <p className="text-lg text-primary mt-1">{vibe.theme}</p>
          )}
          {vibe.notes && (
            <p className="text-muted mt-3">{vibe.notes}</p>
          )}
        </div>
      </div>

      {/* Cuts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text">Cuts</h2>
          <Button onClick={() => setShowCutModal(true)} size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Cut
          </Button>
        </div>

        {vibe.cuts?.length === 0 ? (
          <Card className="text-center py-12">
            <svg className="w-12 h-12 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-muted">No cuts yet</p>
            <p className="text-sm text-muted mt-1">Create a cut to start adding tracks</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {vibe.cuts?.map((cut, index) => (
              <Card key={cut.id} className="group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">{index + 1}</span>
                  </div>
                  <Link to={`/cuts/${cut.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text group-hover:text-primary transition-colors truncate">
                      {cut.name}
                    </h3>
                    <p className="text-sm text-muted">
                      {cut.managedFiles?.length || 0} audio files
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/cuts/${cut.id}`}
                      className="p-2 text-muted hover:text-primary transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDeleteCut(cut.id)}
                      className="p-2 text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Cut Modal */}
      <Modal
        isOpen={showCutModal}
        onClose={() => {
          setShowCutModal(false);
          setCutName('');
          setError('');
        }}
        title="Create New Cut"
      >
        <div className="space-y-4">
          <Input
            label="Cut Name"
            placeholder="Enter cut name"
            value={cutName}
            onChange={(e) => setCutName(e.target.value)}
            error={error}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCutModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCut} isLoading={isSubmitting}>
              Create Cut
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
