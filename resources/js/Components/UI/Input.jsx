import { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeAlpha, sanitizeNumeric, sanitizeMoney, sanitizeContact } from '@/lib/validators';

const sanitizers = {
  alpha: sanitizeAlpha,
  numeric: sanitizeNumeric,
  money: sanitizeMoney,
  contact: sanitizeContact,
};

/**
 * Input
 *
 * inputModeType: 'alpha' | 'numeric' | 'money' | 'contact' | 'email' | 'password' | 'text'
 * Sanitizes value as the user types for alpha/numeric/money/contact modes.
 * Backend validation must still enforce the same rules — this is a UX aid, not a security boundary.
 *
 * Usage:
 *   <Input label="First name" inputModeType="alpha" value={v} onChange={setV} required />
 *   <Input label="Contact number" inputModeType="contact" value={v} onChange={setV} error={errors.contact_number} />
 */
const Input = forwardRef(function Input(
  {
    label,
    helpText,
    error,
    required = false,
    inputModeType = 'text',
    leftIcon = null,
    rightIcon = null,
    value,
    onChange,
    className,
    id,
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const isPassword = inputModeType === 'password';
  const sanitize = sanitizers[inputModeType];

  function handleChange(e) {
    const raw = e.target.value;
    const next = sanitize ? sanitize(raw) : raw;
    onChange?.(next);
  }

  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : inputModeType === 'email' ? 'email' : 'text';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          value={value}
          onChange={handleChange}
          type={resolvedType}
          inputMode={inputModeType === 'numeric' || inputModeType === 'contact' ? 'numeric' : inputModeType === 'money' ? 'decimal' : undefined}
          maxLength={inputModeType === 'contact' ? 11 : props.maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          className={cn(
            'w-full h-10 rounded-input border bg-white text-sm text-text-primary placeholder:text-text-muted',
            'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0',
            leftIcon ? 'pl-10' : 'pl-3.5',
            rightIcon || isPassword ? 'pr-10' : 'pr-3.5',
            error
              ? 'border-danger focus:ring-danger/30'
              : 'border-border focus:border-brand focus:ring-brand/30',
            'disabled:bg-muted disabled:text-text-muted disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}

        {!isPassword && rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      ) : helpText ? (
        <p id={`${inputId}-help`} className="mt-1.5 text-xs text-text-secondary">
          {helpText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
