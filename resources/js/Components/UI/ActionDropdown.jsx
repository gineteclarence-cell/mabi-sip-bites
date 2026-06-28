import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Eye, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  view: Eye,
  edit: Pencil,
  archive: Archive,
  restore: ArchiveRestore,
  delete: Trash2,
};

/**
 * ActionDropdown
 *
 * Floats above the table using fixed positioning calculated from the
 * trigger button's getBoundingClientRect(), rendered via a portal to
 * document.body so it can never be clipped or cause table overflow/scroll.
 *
 * items: [{ key: 'view', label: 'View', onClick: () => {} }, ...]
 * Built-in icons resolve automatically for keys: view, edit, archive, restore, delete.
 *
 * Usage (active record row):
 *   <ActionDropdown items={[
 *     { key: 'view', label: 'View', onClick: () => openView(row) },
 *     { key: 'edit', label: 'Edit', onClick: () => openEdit(row) },
 *     { key: 'archive', label: 'Archive', onClick: () => openArchive(row), danger: false },
 *   ]} />
 *
 * Usage (archived record row):
 *   <ActionDropdown items={[
 *     { key: 'restore', label: 'Restore', onClick: () => openRestore(row) },
 *     { key: 'delete', label: 'Delete', onClick: () => openDelete(row), danger: true },
 *   ]} />
 */
export default function ActionDropdown({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = (items?.length || 1) * 40 + 16;

    // Default: open below-left of the trigger, middle-left of the menu
    // aligned near the three-dot icon.
    let top = rect.bottom + 4;
    let left = rect.right - menuWidth;

    // Flip above if not enough room below the viewport.
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4;
    }

    // Clamp horizontally so it never runs off-screen.
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    setPosition({ top, left });
  }, [items]);

  function toggleOpen() {
    if (!isOpen) calculatePosition();
    setIsOpen((o) => !o);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    function handleReposition() {
      calculatePosition();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, calculatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        className="inline-flex items-center justify-center size-8 rounded-dropdown text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open actions menu"
      >
        <MoreVertical className="size-4" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: position.top, left: position.left, width: 180 }}
            className="z-[90] rounded-dropdown border border-border bg-white shadow-lg py-1.5"
          >
            {items.map((item) => {
              const Icon = iconMap[item.key] || null;
              return (
                <button
                  key={item.key}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors',
                    item.danger
                      ? 'text-danger hover:bg-danger-bg'
                      : 'text-text-primary hover:bg-muted'
                  )}
                >
                  {Icon && <Icon className="size-4" />}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
