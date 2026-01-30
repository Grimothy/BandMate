import { useState } from 'react';
import { ManagedFile } from '../../types';
import { Waveform } from '../audio/Waveform';
import { Card } from '../ui/Card';
import { formatFileSize } from '../../api/files';

interface FileCardProps {
  file: ManagedFile;
  onEdit: (file: ManagedFile) => void;
  onDelete: (file: ManagedFile) => void;
}

export function FileCard({ file, onEdit, onDelete }: FileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayName = file.name || file.originalName;
  const isCut = file.type === 'CUT';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/${file.path}`;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Type Icon */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              isCut ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {isCut ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded ${
                  isCut
                    ? 'bg-primary/20 text-primary'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {file.type}
              </span>
              <h3 className="font-semibold text-text truncate" title={displayName}>
                {displayName}
              </h3>
            </div>
            {file.name && (
              <p className="text-sm text-muted truncate mt-0.5" title={file.originalName}>
                {file.originalName}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
              <span>{formatFileSize(file.fileSize)}</span>
              <span>•</span>
              <span>{new Date(file.createdAt).toLocaleDateString()}</span>
              {file.uploadedBy && (
                <>
                  <span>•</span>
                  <span>by {file.uploadedBy.name}</span>
                </>
              )}
            </div>
            {/* Hierarchy Info */}
            {file.cut && (
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="px-2 py-0.5 bg-surface-light rounded text-muted">
                  {file.cut.vibe.project.name}
                </span>
                <span className="px-2 py-0.5 bg-surface-light rounded text-muted">
                  {file.cut.vibe.name}
                </span>
                <span className="px-2 py-0.5 bg-primary/10 rounded text-primary">
                  {file.cut.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isCut && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title={isExpanded ? 'Collapse player' : 'Expand player'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"
            title="Download"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            onClick={() => onEdit(file)}
            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded transition-colors"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(file)}
            className="p-2 text-muted hover:text-error hover:bg-error/10 rounded transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Waveform Player (for cuts only) */}
      {isCut && isExpanded && (
        <div className="border-t border-border p-4">
          <Waveform audioUrl={`/${file.path}`} />
        </div>
      )}
    </Card>
  );
}
