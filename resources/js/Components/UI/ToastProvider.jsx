import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const typeConfig = {
  success: { icon: CheckCircle2, iconClass: 'text-success' },
  error: { icon: XCircle, iconClass: 'text-danger' },
  warning: { icon: AlertTriangle, iconClass: 'text-warning' },
  info: { icon: Info, iconClass: 'text-text-secondary' },
};

let idCounter = 0;

/**
 * ToastProvider
 *
 * Wrap the app once (in AppLayout or the root Inertia layout).
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast({ title: 'Product created', type: 'success' });
 *   showToast({ title: 'Unable to archive', description: 'Try again.', type: 'error' });
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ title, description, type = 'info', duration = 4000 }) => {
    const id = ++idCounter;
    setToasts((current) => [...current, { id, title, description, type }]);

    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const config = typeConfig[toast.type] || typeConfig.info;
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              role="status"
              style={{ animation: 'toast-in 200ms ease-out' }}
              className="pointer-events-auto flex items-start gap-3 rounded-card border border-border bg-white shadow-lg p-4"
            >
              <Icon className={cn('size-5 shrink-0 mt-0.5', config.iconClass)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs text-text-secondary">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
