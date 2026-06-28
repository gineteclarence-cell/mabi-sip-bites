import { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Select
 *
 * Usage:
 *   <Select label="Branch" value={branchId} onChange={setBranchId} required>
 *     <option value="">Select branch</option>
 *     <option value="1">Branch 1</option>
 *   </Select>
 */
const Select = forwardRef(function Select(
  { label, helpText, error, required = false, value, onChange, className, id, children, ...props },
  ref
) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={!!error}
          className={cn(
            'w-full h-10 rounded-input border bg-white pl-3.5 pr-9 text-sm text-text-primary appearance-none',
            'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-danger focus:ring-danger/30'
              : 'border-border focus:border-brand focus:ring-brand/30',
            'disabled:bg-muted disabled:text-text-muted disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary pointer-events-none" />
      </div>

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

export default Select;
