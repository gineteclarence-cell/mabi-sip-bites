import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';

/**
 * useArchivableRecords (v2 — real backend)
 *
 * Replaces the Phase 6 version that mutated a local in-memory copy of
 * sample data. That approach is why archiving on, say, the Inventory
 * page never showed up on the Archived Records page — each page held
 * its own independent useState() copy of the same imported sample array,
 * with no shared source of truth between them.
 *
 * Now: `records` comes directly from the Inertia prop the controller
 * passed in (already scoped to the user's branch and role server-side).
 * Create/update/archive/restore/delete all go through router.post /
 * router.patch / router.delete against the real routes from
 * routes/web.php. Inertia automatically re-fetches the page's props
 * after each of these, so the Archived Records page and the live page
 * both reflect the same database state — there is no longer a second
 * copy to go stale.
 *
 * Toasts are NOT fired manually here anymore — the controllers already
 * call redirect()->back()->with('success', '...'), and AppLayout's Toast
 * Flash Bridge (reading the `flash` prop shared by HandleInertiaRequests)
 * shows it. This hook only needs to manage modal open/close state and
 * loading flags.
 *
 * Usage:
 *   const {
 *     creating, viewing, editing, archiving,
 *     openCreate, closeCreate, createRecord,
 *     openView, closeView,
 *     openEdit, closeEdit, updateRecord,
 *     openArchive, closeArchive, confirmArchive,
 *   } = useArchivableRecords({
 *     records: props.products,
 *     storeRoute: 'inventory.store',
 *     updateRouteName: 'inventory.update',
 *     module: 'inventory', // matches ArchiveController's MODULE_MAP key
 *   });
 */
export function useArchivableRecords({ records, storeRoute, updateRouteName, module }) {
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = useCallback(() => setCreating(true), []);
  const closeCreate = useCallback(() => setCreating(false), []);

  const openView = useCallback((record) => setViewing(record), []);
  const closeView = useCallback(() => setViewing(null), []);

  const openEdit = useCallback((record) => setEditing(record), []);
  const closeEdit = useCallback(() => setEditing(null), []);

  const openArchive = useCallback((record) => setArchiving(record), []);
  const closeArchive = useCallback(() => setArchiving(null), []);

  const openRestore = useCallback((record) => setRestoring(record), []);
  const closeRestore = useCallback(() => setRestoring(null), []);

  const openDelete = useCallback((record) => setDeleting(record), []);
  const closeDelete = useCallback(() => setDeleting(null), []);

  const createRecord = useCallback((data, options = {}) => {
    setIsSubmitting(true);
    router.post(route(storeRoute), data, {
      onSuccess: () => setCreating(false),
      onError: (errors) => options.onError?.(errors),
      onFinish: () => setIsSubmitting(false),
    });
  }, [storeRoute]);

  const updateRecord = useCallback((id, data, options = {}) => {
    setIsSubmitting(true);
    router.patch(route(updateRouteName, id), data, {
      onSuccess: () => setEditing(null),
      onError: (errors) => options.onError?.(errors),
      onFinish: () => setIsSubmitting(false),
    });
  }, [updateRouteName]);

  const confirmArchive = useCallback(() => {
    if (!archiving) return;
    setIsSubmitting(true);
    router.patch(route('archive.archive', { module, id: archiving.id }), {}, {
      onSuccess: () => setArchiving(null),
      onFinish: () => setIsSubmitting(false),
    });
  }, [archiving, module]);

  const confirmRestore = useCallback(() => {
    if (!restoring) return;
    setIsSubmitting(true);
    router.patch(route('archive.restore', { module, id: restoring.id }), {}, {
      onSuccess: () => setRestoring(null),
      onFinish: () => setIsSubmitting(false),
    });
  }, [restoring, module]);

  const confirmDelete = useCallback(() => {
    if (!deleting) return;
    setIsSubmitting(true);
    router.delete(route('archive.destroy', { module, id: deleting.id }), {
      onSuccess: () => setDeleting(null),
      onFinish: () => setIsSubmitting(false),
    });
  }, [deleting, module]);

  return {
    records,
    isSubmitting,

    creating, viewing, editing, archiving, restoring, deleting,

    openCreate, closeCreate, createRecord,
    openView, closeView,
    openEdit, closeEdit, updateRecord,
    openArchive, closeArchive, confirmArchive,
    openRestore, closeRestore, confirmRestore,
    openDelete, closeDelete, confirmDelete,
  };
}
