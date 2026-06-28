/**
 * buildActionItems
 *
 * Active records get View, Edit, Archive.
 * Archived records get Restore, Delete.
 * Matches the ActionDropdown item shape: { key, label, onClick, danger? }
 */
export function buildActiveActions({ onView, onEdit, onArchive }) {
  return [
    { key: 'view', label: 'View', onClick: onView },
    { key: 'edit', label: 'Edit', onClick: onEdit },
    { key: 'archive', label: 'Archive', onClick: onArchive },
  ];
}

export function buildArchivedActions({ onRestore, onDelete }) {
  return [
    { key: 'restore', label: 'Restore', onClick: onRestore },
    { key: 'delete', label: 'Delete', onClick: onDelete, danger: true },
  ];
}
