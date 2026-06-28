import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Pagination
 *
 * Usage:
 *   <Pagination currentPage={page} totalItems={rows.length} pageSize={10} onPageChange={setPage} />
 */
export default function Pagination({ currentPage = 1, totalItems = 0, pageSize = 10, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  function getPageNumbers() {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }

  return (
    <div className="flex items-center justify-between gap-4 px-2 py-3 flex-wrap">
      <p className="text-xs text-text-secondary">
        Showing <span className="font-medium text-text-primary">{startItem}</span>–
        <span className="font-medium text-text-primary">{endItem}</span> of{' '}
        <span className="font-medium text-text-primary">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center size-8 rounded-dropdown text-text-secondary hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-sm text-text-muted">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'inline-flex items-center justify-center size-8 rounded-dropdown text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-brand text-brand-ink'
                  : 'text-text-secondary hover:bg-muted'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center justify-center size-8 rounded-dropdown text-text-secondary hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
