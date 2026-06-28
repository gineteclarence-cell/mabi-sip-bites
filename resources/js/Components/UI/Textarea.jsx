import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Textarea
 *
 * Usage:
 *   <Textarea label="Description" value={v} onChange={setV} rows={4} />
 */
const Textarea = forwardRef(function Textarea(
  { label, helpText, error, required = false, value, onChange, className, id, rows = 4, ...props },
  ref
) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        rows={rows}
        aria-invalid={!!error}
        className={cn(
          'w-full rounded-input border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none',
          'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-danger focus:ring-danger/30'
            : 'border-border focus:border-brand focus:ring-brand/30',
          'disabled:bg-muted disabled:text-text-muted disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />

      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      ) : helpText ? (
        <p className="mt-1.5 text-xs text-text-secondary">{helpText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
