import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState
 *
 * Usage:
 *   <EmptyState
 *     icon={PackageX}
 *     title="No products yet"
 *     description="Products you add will appear here."
 *     actionLabel="Add product"
 *     onAction={() => setCreateOpen(true)}
 *   />
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex items-center justify-center size-12 rounded-full bg-muted text-text-secondary mb-4">
        <Icon className="size-6" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {description && <p className="mt-1 text-sm text-text-secondary max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
