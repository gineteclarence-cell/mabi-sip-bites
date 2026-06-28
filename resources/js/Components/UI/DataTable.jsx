import { useState } from 'react';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { cn } from '@/lib/utils';

/**
 * DataTable
 *
 * columns: [{ key: 'name', header: 'Name', render?: (row) => node, className?: string }]
 * actions: (row) => node — typically an <ActionDropdown items={...} />, rendered as the last column.
 * data: full array of rows (client-side pagination, 10 per page by default).
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: 'name', header: 'Product' },
 *       { key: 'stock', header: 'Stock', render: (row) => <span>{row.stock}</span> },
 *     ]}
 *     data={products}
 *     actions={(row) => <ActionDropdown items={buildActions(row)} />}
 *     emptyTitle="No products yet"
 *     emptyDescription="Products you add will appear here."
 *   />
 */
export default function DataTable({
  columns,
  data = [],
  actions,
  pageSize = 10,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyActionLabel,
  onEmptyAction,
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageData = data.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (data.length === 0) {
    return (
      <div className="rounded-card border border-border bg-white">
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-left font-medium text-text-secondary px-4 py-3 whitespace-nowrap',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 w-12">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, rowIdx) => (
              <tr
                key={row.id ?? rowIdx}
                className="border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-text-primary', col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-2">
        <Pagination
          currentPage={safePage}
          totalItems={data.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
