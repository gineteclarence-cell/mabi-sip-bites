import { cn } from '@/lib/utils';

const variantClasses = {
  neutral: 'bg-muted text-text-secondary',
  brand: 'bg-brand/20 text-brand-ink',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
};

/**
 * Badge
 *
 * Variants: neutral, brand, success, warning, danger
 *
 * Usage:
 *   <Badge variant="success">Active</Badge>
 *   <Badge variant="warning">Low stock</Badge>
 *   <Badge variant="neutral">Archived</Badge>
 */
export default function Badge({ variant = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
