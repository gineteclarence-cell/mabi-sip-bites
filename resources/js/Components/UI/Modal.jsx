import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

/**
 * Modal
 *
 * Usage:
 *   <Modal isOpen={open} onClose={() => setOpen(false)} title="Add product" maxWidth="lg">
 *     <p>Content here</p>
 *   </Modal>
 *
 * closeOnOverlay defaults to true; pass false for forms with unsaved changes
 * if you want to force an explicit Cancel/Close click.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  closeOnOverlay = true,
}) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        onClose={closeOnOverlay ? onClose : () => {}}
        className="relative z-50"
      >
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={cn(
                'w-full rounded-modal bg-white shadow-xl',
                maxWidthClasses[maxWidth]
              )}
            >
              {(title || description) && (
                <div className="flex items-start justify-between gap-4 p-6 pb-0">
                  <div>
                    {title && (
                      <DialogTitle className="text-base font-semibold text-text-primary">
                        {title}
                      </DialogTitle>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-text-secondary">{description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1.5 text-text-secondary hover:bg-muted hover:text-text-primary transition-colors"
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              <div className="p-6">{children}</div>

              {footer && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                  {footer}
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
