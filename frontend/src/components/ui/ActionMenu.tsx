import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { SideSheet } from './Modal';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  /** Hide this item if false */
  visible?: boolean;
  /** Optional description shown in ActionSheet */
  description?: string;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  className?: string;
}

let hasWarnedDeprecation = false;

/**
 * @deprecated Use ActionSheet for mobile-friendly touch targets
 */
export function ActionMenu({ items, className = '' }: ActionMenuProps) {
  // Warn once about deprecated usage
  if (!hasWarnedDeprecation) {
    console.warn(
      'ActionMenu is deprecated. Use ActionSheet for mobile-friendly touch targets.'
    );
    hasWarnedDeprecation = true;
  }

  // Filter items based on visibility (default to true if not specified)
  const visibleItems = items.filter(item => item.visible !== false);

  // Don't render menu if no visible items
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`p-2 text-primary hover:text-primary-foreground hover:bg-primary/20 rounded-lg transition-colors border border-transparent hover:border-primary/30 ${className}`}
          aria-label="Actions menu"
          onClick={(e) => e.preventDefault()}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
        {visibleItems.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.onClick();
            }}
            className={`flex items-center gap-3 cursor-pointer ${
              item.variant === 'danger'
                ? 'text-error focus:text-error focus:bg-error/10'
                : 'text-text focus:bg-surface-light'
            }`}
          >
            {item.icon && <span className="w-4 h-4">{item.icon}</span>}
            <span className="text-sm">{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ActionSheetProps {
  items: ActionMenuItem[];
  className?: string;
  title?: string;
}

/**
 * Mobile-friendly action menu using SideSheet with large touch targets
 * Replaces ActionMenu for better mobile UX
 * @param items - Array of action menu items with icons, labels, and callbacks
 * @param className - Optional CSS classes for the trigger button
 * @param title - Sheet title shown in the header (defaults to "Actions")
 */
export function ActionSheet({ items, className = '', title = 'Actions' }: ActionSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter items based on visibility (default to true if not specified)
  const visibleItems = items.filter(item => item.visible !== false);

  // Don't render if no visible items
  if (visibleItems.length === 0) {
    return null;
  }

  const handleItemClick = async (onClick: () => void) => {
    // Close sheet first to allow action dialogs (like confirm) to show properly
    setIsOpen(false);
    
    // Execute action after sheet starts closing
    try {
      await Promise.resolve(onClick());
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          setIsOpen(true);
        }}
        className={`p-2 text-primary hover:text-primary-foreground hover:bg-primary/20 rounded-lg transition-colors border border-transparent hover:border-primary/30 ${className}`}
        aria-label="Actions menu"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="action-sheet-content"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      <SideSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        description="Choose an action"
      >
        <div 
          id="action-sheet-content"
          className="space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {visibleItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleItemClick(item.onClick)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              className={`flex items-center gap-4 w-full min-h-[44px] p-4 rounded-lg bg-surface-light transition-colors text-left ${
                item.variant === 'danger'
                  ? 'hover:bg-error/10'
                  : 'hover:bg-primary/10'
              }`}
              style={{ minHeight: '44px' }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.variant === 'danger'
                    ? 'bg-error/20'
                    : 'bg-primary/20'
                }`}
              >
                {item.icon && (
                  <span
                    className={`w-5 h-5 ${
                      item.variant === 'danger' ? 'text-error' : 'text-primary'
                    }`}
                  >
                    {item.icon}
                  </span>
                )}
              </div>
              <div>
                <p
                  className={`font-medium ${
                    item.variant === 'danger' ? 'text-error' : 'text-text'
                  }`}
                >
                  {item.label}
                </p>
                {item.description && (
                  <p className="text-sm text-muted">{item.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </SideSheet>
    </>
  );
}
