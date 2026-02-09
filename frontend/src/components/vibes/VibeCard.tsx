import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Vibe, Cut } from '../../types';
import { Card, CardImage } from '../ui/Card';
import { ActionSheet } from '../ui/ActionMenu';
import { SideSheet } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ImageUploadSheet } from '../files/ImageUploadSheet';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCutItemProps {
  cut: Cut;
  index: number;
  onOpenActions: (cut: Cut) => void;
}

function SortableCutItem({ cut, index, onOpenActions }: SortableCutItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cut.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const firstAudioFile = cut.managedFiles?.[0];
  const creator = firstAudioFile?.uploadedBy;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-surface-light transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-muted hover:text-text cursor-grab active:cursor-grabbing"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>
      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-primary text-sm font-bold">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <Link
          to={`/cuts/${cut.id}`}
          className="block"
        >
          <h4 className="font-medium text-text group-hover:text-primary transition-colors truncate">
            {cut.name}
          </h4>
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          {cut.bpm && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">
              {cut.bpm} BPM
            </span>
          )}
          {cut.timeSignature && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-secondary/20 text-secondary-foreground">
              {cut.timeSignature}
            </span>
          )}
          {creator && (
            <p className="text-xs text-muted truncate">
              by {creator.name}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => onOpenActions(cut)}
        className="p-2 text-muted hover:text-primary hover:bg-surface-light rounded-lg transition-colors"
        title="Cut actions"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
    </div>
  );
}

interface VibeCardProps {
  vibe: Vibe;
  allVibes?: Vibe[];
  onCreateCut: (vibeId: string, data: { name: string; bpm?: number; timeSignature?: string }) => Promise<void>;
  onDeleteCut: (cutId: string) => Promise<void>;
  onUpdateCut: (cutId: string, data: { name?: string; bpm?: number | null; timeSignature?: string | null }) => Promise<void>;
  onMoveCut?: (cutId: string, targetVibeId: string) => Promise<void>;
  onEditVibe: (vibeId: string, data: { name?: string; theme?: string; notes?: string }) => Promise<void>;
  onDeleteVibe: (vibeId: string) => Promise<void>;
  onUploadImage: (vibeId: string, file: File) => Promise<void>;
}

export function VibeCard({
  vibe,
  allVibes,
  onCreateCut,
  onDeleteCut,
  onUpdateCut,
  onMoveCut,
  onEditVibe,
  onDeleteVibe,
  onUploadImage,
}: VibeCardProps) {
  // Make the vibe card a drop target for cross-vibe drag and drop
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: vibe.id,
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddCutModal, setShowAddCutModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showEditCutModal, setShowEditCutModal] = useState(false);
  const [showCutActionsSheet, setShowCutActionsSheet] = useState(false);
  const [showMoveCutModal, setShowMoveCutModal] = useState(false);
  const [selectedCut, setSelectedCut] = useState<Cut | null>(null);
  const [editingCut, setEditingCut] = useState<Cut | null>(null);
  const [selectedTargetVibeId, setSelectedTargetVibeId] = useState<string>('');
  const [cutName, setCutName] = useState('');
  const [cutBpm, setCutBpm] = useState<string>('');
  const [cutTimeSignature, setCutTimeSignature] = useState<string>('');
  const [editForm, setEditForm] = useState({
    name: vibe.name,
    theme: vibe.theme || '',
    notes: vibe.notes || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddCut = async () => {
    if (!cutName.trim()) {
      setError('Cut name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const data: { name: string; bpm?: number; timeSignature?: string } = { name: cutName };
      if (cutBpm) data.bpm = parseInt(cutBpm, 10);
      if (cutTimeSignature) data.timeSignature = cutTimeSignature;
      await onCreateCut(vibe.id, data);
      setCutName('');
      setCutBpm('');
      setCutTimeSignature('');
      setShowAddCutModal(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to create cut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCutActions = (cut: Cut) => {
    setSelectedCut(cut);
    setShowCutActionsSheet(true);
  };

  const handleCloseCutActions = () => {
    setShowCutActionsSheet(false);
    setSelectedCut(null);
  };

  const handleEditCutMetadata = (cut: Cut) => {
    setEditingCut(cut);
    setCutBpm(cut.bpm?.toString() || '');
    setCutTimeSignature(cut.timeSignature || '');
    setShowEditCutModal(true);
  };

  const handleSaveCutMetadata = async () => {
    if (!editingCut) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onUpdateCut(editingCut.id, {
        bpm: cutBpm ? parseInt(cutBpm, 10) : null,
        timeSignature: cutTimeSignature || null,
      });
      setShowEditCutModal(false);
      setEditingCut(null);
      setCutBpm('');
      setCutTimeSignature('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to update cut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVibe = async () => {
    if (!editForm.name.trim()) {
      setError('Vibe name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onEditVibe(vibe.id, editForm);
      setShowEditModal(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to update vibe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVibe = async () => {
    if (!confirm('Are you sure you want to delete this vibe and all its cuts?')) return;
    await onDeleteVibe(vibe.id);
  };

  const handleDeleteCut = async (cutId: string) => {
    if (!confirm('Are you sure you want to delete this cut?')) return;
    await onDeleteCut(cutId);
  };

  const handleMoveCut = async () => {
    if (!selectedCut || !selectedTargetVibeId || !onMoveCut) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onMoveCut(selectedCut.id, selectedTargetVibeId);
      setShowMoveCutModal(false);
      setSelectedCut(null);
      setSelectedTargetVibeId('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to move cut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const otherVibes = allVibes?.filter(v => v.id !== vibe.id) || [];

  const handleImageUpload = async (file: File) => {
    await onUploadImage(vibe.id, file);
  };

  const actionMenuItems = [
    {
      label: 'Add Cut',
      description: 'Create a new cut for this vibe',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: () => setShowAddCutModal(true),
    },
    {
      label: 'Edit Vibe',
      description: 'Update name, theme, and notes',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: () => {
        setEditForm({
          name: vibe.name,
          theme: vibe.theme || '',
          notes: vibe.notes || '',
        });
        setShowEditModal(true);
      },
    },
    {
      label: 'Upload Image',
      description: 'Add or change cover image',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => setShowImageUpload(true),
    },
    {
      label: 'Delete Vibe',
      description: 'Permanently remove this vibe and all cuts',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: handleDeleteVibe,
      variant: 'danger' as const,
    },
  ];

  return (
    <>
      <Card 
        ref={setDroppableRef}
        className={`overflow-hidden transition-all ${isOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
      >
        {/* Header with image and info */}
        <div className="flex gap-4">
          {/* Image */}
          <div className="w-32 h-32 flex-shrink-0 relative">
            <CardImage src={vibe.image} alt={vibe.name} className="!aspect-square h-full" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-lg text-text truncate">{vibe.name}</h3>
                {vibe.theme && (
                  <p className="text-sm text-primary truncate">{vibe.theme}</p>
                )}
              </div>
              <ActionSheet items={actionMenuItems} title={vibe.name} />
            </div>
            {vibe.notes && (
              <p className="text-sm text-muted mt-1 line-clamp-2">{vibe.notes}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted">
              <span>{vibe.cuts?.length || 0} cuts</span>
            </div>
          </div>
        </div>

        {/* Cuts Section */}
        <div className="mt-4 border-t border-border pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-text transition-colors w-full"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Cuts ({vibe.cuts?.length || 0})
          </button>

          {isExpanded && (
            <div className="mt-3">
              {vibe.cuts?.length === 0 ? (
                <p className="text-sm text-muted py-2">No cuts yet. Add one to get started.</p>
              ) : (
                <SortableContext
                  items={vibe.cuts?.map(cut => cut.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {vibe.cuts?.map((cut, index) => (
                      <SortableCutItem
                        key={cut.id}
                        cut={cut}
                        index={index}
                        onOpenActions={handleOpenCutActions}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}

              {/* Add Cut Button */}
              <button
                onClick={() => setShowAddCutModal(true)}
                className="flex items-center gap-2 w-full p-2 -mx-2 rounded-lg text-sm text-muted hover:text-primary hover:bg-surface-light transition-colors mt-2"
              >
                <div className="w-8 h-8 border-2 border-dashed border-current rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span>Add Cut</span>
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Add Cut Side Sheet */}
      <SideSheet
        isOpen={showAddCutModal}
        onClose={() => {
          setShowAddCutModal(false);
          setCutName('');
          setError('');
        }}
        title="Add New Cut"
        description="Create a new cut in this vibe"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddCutModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCut} isLoading={isSubmitting}>
              Add Cut
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cut Name"
            placeholder="Enter cut name"
            value={cutName}
            onChange={(e) => setCutName(e.target.value)}
            error={error}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCut();
            }}
          />
        </div>
      </SideSheet>

      {/* Edit Vibe Side Sheet */}
      <SideSheet
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setError('');
        }}
        title="Edit Vibe"
        description="Update the vibe details"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditVibe} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Vibe Name"
            placeholder="Enter vibe name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            error={error}
            autoFocus
          />
          <Input
            label="Theme (optional)"
            placeholder="e.g., Summer vibes, Dark ambient"
            value={editForm.theme}
            onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Notes (optional)
            </label>
            <textarea
              placeholder="Add any notes about this vibe..."
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>
        </div>
      </SideSheet>

      {/* Vibe Image Upload Side Sheet */}
      <ImageUploadSheet
        isOpen={showImageUpload}
        onClose={() => setShowImageUpload(false)}
        onUpload={handleImageUpload}
        title="Upload Vibe Image"
        description={`Add a cover image for "${vibe.name}"`}
        currentImage={vibe.image}
      />

      {/* Edit Cut BPM/Time Signature Side Sheet */}
      <SideSheet
        isOpen={showEditCutModal}
        onClose={() => {
          setShowEditCutModal(false);
          setEditingCut(null);
          setCutBpm('');
          setCutTimeSignature('');
          setError('');
        }}
        title="Set BPM & Time Signature"
        description={editingCut ? `Update tempo info for "${editingCut.name}"` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditCutModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCutMetadata} isLoading={isSubmitting}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="BPM (Beats Per Minute)"
            type="number"
            placeholder="e.g., 120"
            value={cutBpm}
            onChange={(e) => setCutBpm(e.target.value)}
            min={1}
            max={999}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Time Signature
            </label>
            <select
              value={cutTimeSignature}
              onChange={(e) => setCutTimeSignature(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select time signature</option>
              <option value="4/4">4/4 (Common Time)</option>
              <option value="3/4">3/4 (Waltz)</option>
              <option value="6/8">6/8</option>
              <option value="2/4">2/4</option>
              <option value="5/4">5/4</option>
              <option value="7/8">7/8</option>
              <option value="12/8">12/8</option>
            </select>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
      </SideSheet>

      {/* Cut Actions Side Sheet */}
      <SideSheet
        isOpen={showCutActionsSheet}
        onClose={handleCloseCutActions}
        title={selectedCut?.name || 'Cut Actions'}
        description="Choose an action"
      >
        <div className="space-y-2">
          {/* Open Cut */}
          <Link
            to={selectedCut ? `/cuts/${selectedCut.id}` : '#'}
            onClick={handleCloseCutActions}
            className="flex items-center gap-4 w-full p-4 rounded-lg bg-surface-light hover:bg-primary/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-text">Open Cut</p>
              <p className="text-sm text-muted">View and edit audio files</p>
            </div>
          </Link>

          {/* Set BPM & Time Signature */}
          <button
            onClick={() => {
              if (selectedCut) {
                handleEditCutMetadata(selectedCut);
                handleCloseCutActions();
              }
            }}
            className="flex items-center gap-4 w-full p-4 rounded-lg bg-surface-light hover:bg-primary/10 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-text">Set BPM & Time</p>
              <p className="text-sm text-muted">
                {selectedCut?.bpm || selectedCut?.timeSignature 
                  ? `Current: ${selectedCut?.bpm ? `${selectedCut.bpm} BPM` : ''}${selectedCut?.bpm && selectedCut?.timeSignature ? ' · ' : ''}${selectedCut?.timeSignature || ''}`
                  : 'Add tempo information'}
              </p>
            </div>
          </button>

          {/* Move Cut to Another Vibe */}
          {onMoveCut && otherVibes.length > 0 && (
            <button
              onClick={() => {
                // Close actions sheet but keep selectedCut for the move modal
                setShowCutActionsSheet(false);
                setShowMoveCutModal(true);
              }}
              className="flex items-center gap-4 w-full p-4 rounded-lg bg-surface-light hover:bg-primary/10 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-text">Move to Another Vibe</p>
                <p className="text-sm text-muted">Move this cut to a different vibe</p>
              </div>
            </button>
          )}

          {/* Delete Cut */}
          <button
            onClick={() => {
              if (selectedCut) {
                const cutId = selectedCut.id;
                handleCloseCutActions();
                handleDeleteCut(cutId);
              }
            }}
            className="flex items-center gap-4 w-full p-4 rounded-lg bg-surface-light hover:bg-error/10 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-error">Delete Cut</p>
              <p className="text-sm text-muted">Permanently remove this cut</p>
            </div>
          </button>
        </div>
      </SideSheet>

      {/* Move Cut Side Sheet */}
      <SideSheet
        isOpen={showMoveCutModal}
        onClose={() => {
          setShowMoveCutModal(false);
          setSelectedCut(null);
          setSelectedTargetVibeId('');
          setError('');
        }}
        title="Move Cut"
        description={selectedCut ? `Move "${selectedCut.name}" to another vibe` : 'Select a vibe'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowMoveCutModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMoveCut} 
              isLoading={isSubmitting}
              disabled={!selectedTargetVibeId}
            >
              Move Cut
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {otherVibes.length === 0 ? (
            <p className="text-muted text-center py-4">No other vibes available in this project</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted mb-3">Select the destination vibe:</p>
              {otherVibes.map((targetVibe) => (
                <label
                  key={targetVibe.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTargetVibeId === targetVibe.id
                      ? 'bg-primary/10 border border-primary'
                      : 'bg-surface-light border border-transparent hover:border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetVibe"
                    value={targetVibe.id}
                    checked={selectedTargetVibeId === targetVibe.id}
                    onChange={(e) => setSelectedTargetVibeId(e.target.value)}
                    className="hidden"
                  />
                  <div className="w-10 h-10 bg-surface rounded-lg overflow-hidden flex-shrink-0">
                    {targetVibe.image ? (
                      <img 
                        src={targetVibe.image} 
                        alt={targetVibe.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-medium text-sm">
                          {targetVibe.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">{targetVibe.name}</p>
                    <p className="text-sm text-muted">
                      {targetVibe.cuts?.length || 0} cuts
                      {targetVibe.theme && ` · ${targetVibe.theme}`}
                    </p>
                  </div>
                  {selectedTargetVibeId === targetVibe.id && (
                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          )}
          {error && <p className="text-error text-sm">{error}</p>}
        </div>
      </SideSheet>
    </>
  );
}
