import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variantClasses = {
  primary:
    'bg-brand text-brand-ink hover:bg-brand-hover active:bg-brand-hover border border-transparent shadow-sm',
  secondary:
    'bg-sidebar text-white hover:bg-sidebar-hover active:bg-sidebar-hover border border-transparent',
  outline:
    'bg-transparent text-text-primary border border-border hover:bg-muted active:bg-muted',
  ghost:
    'bg-transparent text-text-secondary hover:bg-muted hover:text-text-primary border border-transparent',
  danger:
    'bg-danger text-white hover:bg-red-700 active:bg-red-700 border border-transparent shadow-sm',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

/**
 * Button
 *
 * Variants: primary, secondary, outline, ghost, danger
 * Sizes: sm, md, lg
 * States: hover, active, disabled, loading (handled automatically)
 *
 * Usage:
 *   <Button variant="primary" onClick={handleSave}>Save changes</Button>
 *   <Button variant="danger" loading={isDeleting}>Delete</Button>
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon = null,
    rightIcon = null,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-btn transition-colors duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export default Button;
