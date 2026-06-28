import { AlertTriangle, ArchiveRestore, Trash2, LogOut, Archive } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { cn } from '@/lib/utils';

const intentConfig = {
  archive: {
    icon: Archive,
    iconClass: 'text-warning bg-warning-bg',
    confirmVariant: 'primary',
    confirmLabel: 'Archive',
  },
  restore: {
    icon: ArchiveRestore,
    iconClass: 'text-success bg-success-bg',
    confirmVariant: 'primary',
    confirmLabel: 'Restore',
  },
  delete: {
    icon: Trash2,
    iconClass: 'text-danger bg-danger-bg',
    confirmVariant: 'danger',
    confirmLabel: 'Delete',
  },
  logout: {
    icon: LogOut,
    iconClass: 'text-text-secondary bg-muted',
    confirmVariant: 'danger',
    confirmLabel: 'Logout',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning bg-warning-bg',
    confirmVariant: 'primary',
    confirmLabel: 'Continue',
  },
};

/**
 * ConfirmModal
 *
 * intent: 'archive' | 'restore' | 'delete' | 'logout' | 'warning'
 *
 * Usage:
 *   <ConfirmModal
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     onConfirm={handleArchive}
 *     intent="archive"
 *     title="Archive this product?"
 *     description="You can restore it later from Archived Records."
 *     loading={isSubmitting}
 *   />
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  intent = 'warning',
  title,
  description,
  confirmLabel,
  loading = false,
}) {
  const config = intentConfig[intent];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" closeOnOverlay={!loading}>
      <div className="flex flex-col items-center text-center">
        <div className={cn('flex items-center justify-center size-12 rounded-full mb-4', config.iconClass)}>
          <Icon className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {description && <p className="mt-2 text-sm text-text-secondary">{description}</p>}

        <div className="flex items-center gap-3 mt-6 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={config.confirmVariant}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel || config.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
