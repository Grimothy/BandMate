import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
  const hoverClasses = hoverable
    ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all'
    : '';

  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export function CardImage({ src, alt, className = '' }: CardImageProps) {
  if (!src) {
    return (
      <div
        className={`w-full aspect-video bg-surface-light rounded-lg flex items-center justify-center ${className}`}
      >
        <svg
          className="w-12 h-12 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={`/${src}`}
      alt={alt}
      className={`w-full aspect-video object-cover rounded-lg ${className}`}
    />
  );
}
