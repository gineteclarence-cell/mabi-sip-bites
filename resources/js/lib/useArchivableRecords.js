import { useState, useCallback } from 'react';
import { useToast } from '@/Components/UI/ToastProvider';

let nextId = 100000; // high starting id so it never collides with seeded sample ids

/**
 * useArchivableRecords
 *
 * Encapsulates the full create / view / edit / archive / restore / delete
 * flow against in-memory sample state, for use before the real backend
 * (Phase 7) is wired up. Every page (Sales, Inventory, Staff, Attendance,
 * Tasks, Branches) uses this same hook so the toast copy, modal sequencing,
 * and archive/restore/delete behavior are identical everywhere — no page
 * can silently drift out of sync with the spec.
 *
 * Swapping to real backend later (Phase 7): replace `createRecord`,
 * `updateRecord`, `archiveRecord`, `restoreRecord`, `deleteRecord` bodies
 * with router.post/patch/delete calls to the real routes; keep the same
 * modal-state shape (`viewing`, `editing`, `archiving`, `restoring`,
 * `deleting`, `creating`) so the page components don't need to change.
 *
 * Usage:
 *   const {
 *     records, archivedRecords,
 *     creating, viewing, editing, archiving, restoring, deleting,
 *     openCreate, closeCreate, createRecord,
 *     openView, closeView,
 *     openEdit, closeEdit, updateRecord,
 *     openArchive, closeArchive, confirmArchive,
 *     openRestore, closeRestore, confirmRestore,
 *     openDelete, closeDelete, confirmDelete,
 *   } = useArchivableRecords(initialSampleData, { entityLabel: 'Product' });
 */
export function useArchivableRecords(initialData, { entityLabel = 'Record' } = {}) {
  const { showToast } = useToast();
  const [allRecords, setAllRecords] = useState(initialData);

  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const records = allRecords.filter((r) => r.status !== 'archived');
  const archivedRecords = allRecords.filter((r) => r.status === 'archived');

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

  const createRecord = useCallback((data) => {
    setIsSubmitting(true);
    const newRecord = { id: ++nextId, status: 'active', ...data };
    setAllRecords((current) => [newRecord, ...current]);
    setIsSubmitting(false);
    setCreating(false);
    showToast({ type: 'success', title: `${entityLabel} created successfully.` });
  }, [entityLabel, showToast]);

  const updateRecord = useCallback((id, data) => {
    setIsSubmitting(true);
    setAllRecords((current) => current.map((r) => (r.id === id ? { ...r, ...data } : r)));
    setIsSubmitting(false);
    setEditing(null);
    showToast({ type: 'success', title: `${entityLabel} updated successfully.` });
  }, [entityLabel, showToast]);

  const confirmArchive = useCallback(() => {
    if (!archiving) return;
    setIsSubmitting(true);
    setAllRecords((current) =>
      current.map((r) =>
        r.id === archiving.id ? { ...r, status: 'archived', archived_at: new Date().toISOString() } : r
      )
    );
    setIsSubmitting(false);
    setArchiving(null);
    showToast({ type: 'success', title: 'Record archived successfully.' });
  }, [archiving, showToast]);

  const confirmRestore = useCallback(() => {
    if (!restoring) return;
    setIsSubmitting(true);
    setAllRecords((current) =>
      current.map((r) =>
        r.id === restoring.id ? { ...r, status: 'active', archived_at: null } : r
      )
    );
    setIsSubmitting(false);
    setRestoring(null);
    showToast({ type: 'success', title: 'Record restored successfully.' });
  }, [restoring, showToast]);

  const confirmDelete = useCallback(() => {
    if (!deleting) return;
    setIsSubmitting(true);
    setAllRecords((current) => current.filter((r) => r.id !== deleting.id));
    setIsSubmitting(false);
    setDeleting(null);
    showToast({ type: 'success', title: 'Record deleted successfully.' });
  }, [deleting, showToast]);

  return {
    records,
    archivedRecords,
    isSubmitting,

    creating,
    viewing,
    editing,
    archiving,
    restoring,
    deleting,

    openCreate,
    closeCreate,
    createRecord,

    openView,
    closeView,

    openEdit,
    closeEdit,
    updateRecord,

    openArchive,
    closeArchive,
    confirmArchive,

    openRestore,
    closeRestore,
    confirmRestore,

    openDelete,
    closeDelete,
    confirmDelete,
  };
}
