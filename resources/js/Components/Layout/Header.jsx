import { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Header
 *
 * Usage:
 *   <Header
 *     title="Dashboard"
 *     subtitle="Overview across both branches"
 *     user={{ name: 'Mabel Reyes', role: 'owner' }}
 *     branches={[{ id: 1, name: 'Branch 1' }, { id: 2, name: 'Branch 2' }]}
 *     selectedBranchId={branchId}
 *     onBranchChange={setBranchId}
 *     onMenuClick={() => setMobileOpen(true)}
 *   />
 */
export default function Header({
  title,
  subtitle,
  user,
  branches = [],
  selectedBranchId,
  onBranchChange,
  onMenuClick,
}) {
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const branchMenuRef = useRef(null);

  const isOwner = user?.role === 'owner';
  const selectedBranch = branches.find((b) => String(b.id) === String(selectedBranchId));

  useEffect(() => {
    if (!branchMenuOpen) return;
    function handleClickOutside(e) {
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target)) {
        setBranchMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [branchMenuOpen]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-white px-4 py-4 lg:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-dropdown p-2 text-text-secondary hover:bg-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-text-primary font-display">{title}</h1>
          {subtitle && <p className="truncate text-sm text-text-secondary">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isOwner && branches.length > 0 && (
          <div className="relative" ref={branchMenuRef}>
            <button
              type="button"
              onClick={() => setBranchMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-dropdown border border-border bg-white px-3 py-2 text-sm text-text-primary hover:bg-muted transition-colors"
            >
              <Building2 className="size-4 text-text-secondary" />
              <span className="hidden sm:inline">{selectedBranch?.name || 'All branches'}</span>
              <ChevronDown className="size-4 text-text-secondary" />
            </button>

            {branchMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-dropdown border border-border bg-white py-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onBranchChange?.(null);
                    setBranchMenuOpen(false);
                  }}
                  className={cn(
                    'block w-full px-3.5 py-2 text-left text-sm hover:bg-muted',
                    !selectedBranchId ? 'text-brand-ink font-medium' : 'text-text-primary'
                  )}
                >
                  All branches
                </button>
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => {
                      onBranchChange?.(branch.id);
                      setBranchMenuOpen(false);
                    }}
                    className={cn(
                      'block w-full px-3.5 py-2 text-left text-sm hover:bg-muted',
                      String(selectedBranchId) === String(branch.id) ? 'text-brand-ink font-medium' : 'text-text-primary'
                    )}
                  >
                    {branch.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5 border-l border-border pl-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-ink">
            {initials}
          </div>
          <div className="hidden text-left leading-tight sm:block">
            <p className="text-sm font-medium text-text-primary">{user?.name}</p>
            <p className="text-xs capitalize text-text-secondary">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
