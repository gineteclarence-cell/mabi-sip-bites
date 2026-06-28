import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Archive } from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import DataTable from '@/Components/UI/DataTable';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import Badge from '@/Components/UI/Badge';
import { useToast } from '@/Components/UI/ToastProvider';
import { buildArchivedActions } from '@/lib/buildActionItems';
import { cn } from '@/lib/utils';
import {
  sampleBranches,
  sampleProducts,
  sampleStaff,
  sampleSales,
  sampleTasks,
} from '@/lib/sampleRecords';

/**
 * Archived Records
 *
 * Consolidates archived items across every entity that supports the
 * archive flow (Branches, Inventory, Staff, Sales, Tasks). Attendance is
 * intentionally excluded — per 02_DATABASE_DESIGN.md, attendance_logs has
 * no status/archived_at columns, so it has nothing to surface here.
 *
 * Each tab keeps its own independent in-memory record list (sample data
 * for now) so Restore/Delete on one tab can't affect another. In Phase 7,
 * each tab's data source becomes a real Inertia prop scoped to that
 * module, and Restore/Delete becomes a real PATCH/DELETE to the shared
 * ArchiveController routes from 07_BACKEND_CONTROLLERS_AND_ROUTES.md.
 */

const tabs = [
  { key: 'branches', label: 'Branches' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'staff', label: 'Staff' },
  { key: 'sales', label: 'Sales' },
  { key: 'tasks', label: 'Tasks' },
];

function useArchivedTab(initialData, entityLabel) {
  const { showToast } = useToast();
  const [allRecords, setAllRecords] = useState(initialData);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const archivedRecords = allRecords.filter((r) => r.status === 'archived');

  function confirmRestore() {
    if (!restoring) return;
    setIsSubmitting(true);
    setAllRecords((current) =>
      current.map((r) => (r.id === restoring.id ? { ...r, status: 'active', archived_at: null } : r))
    );
    setIsSubmitting(false);
    setRestoring(null);
    showToast({ type: 'success', title: 'Record restored successfully.' });
  }

  function confirmDelete() {
    if (!deleting) return;
    setIsSubmitting(true);
    setAllRecords((current) => current.filter((r) => r.id !== deleting.id));
    setIsSubmitting(false);
    setDeleting(null);
    showToast({ type: 'success', title: 'Record deleted successfully.' });
  }

  return {
    archivedRecords, restoring, deleting, isSubmitting,
    setRestoring, setDeleting, confirmRestore, confirmDelete,
    entityLabel,
  };
}

function ArchivedTabPanel({ tab, columns }) {
  const {
    archivedRecords, restoring, deleting, isSubmitting,
    setRestoring, setDeleting, confirmRestore, confirmDelete, entityLabel,
  } = tab;

  return (
    <>
      <DataTable
        columns={columns}
        data={archivedRecords}
        actions={(row) => (
          <ActionDropdown
            items={buildArchivedActions({
              onRestore: () => setRestoring(row),
              onDelete: () => setDeleting(row),
            })}
          />
        )}
        emptyIcon={Archive}
        emptyTitle={`No archived ${entityLabel.toLowerCase()} records`}
        emptyDescription={`${entityLabel} you archive will appear here.`}
      />

      <ConfirmModal
        isOpen={!!restoring}
        onClose={() => setRestoring(null)}
        onConfirm={confirmRestore}
        intent="restore"
        title={`Restore this ${entityLabel.toLowerCase()}?`}
        description="It will move back to the active list."
        loading={isSubmitting}
      />

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        intent="delete"
        title={`Permanently delete this ${entityLabel.toLowerCase()}?`}
        description="This action cannot be undone."
        loading={isSubmitting}
      />
    </>
  );
}

function ArchivedPageContent() {
  const [activeTab, setActiveTab] = useState('branches');

  const branchesTab = useArchivedTab(sampleBranches, 'Branch');
  const inventoryTab = useArchivedTab(sampleProducts, 'Product');
  const staffTab = useArchivedTab(sampleStaff, 'Staff');
  const salesTab = useArchivedTab(sampleSales, 'Sale');
  const tasksTab = useArchivedTab(sampleTasks, 'Task');

  const tabData = {
    branches: {
      tab: branchesTab,
      columns: [
        { key: 'name', header: 'Branch' },
        { key: 'location', header: 'Location' },
        { key: 'contact_number', header: 'Contact number' },
      ],
    },
    inventory: {
      tab: inventoryTab,
      columns: [
        { key: 'name', header: 'Product' },
        { key: 'category', header: 'Category' },
        { key: 'branch_name', header: 'Branch' },
        { key: 'stock', header: 'Stock' },
      ],
    },
    staff: {
      tab: staffTab,
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role', render: (row) => <Badge variant="neutral">{row.role}</Badge> },
      ],
    },
    sales: {
      tab: salesTab,
      columns: [
        { key: 'transaction_number', header: 'Transaction' },
        { key: 'branch_name', header: 'Branch' },
        { key: 'total_amount', header: 'Amount', render: (row) => `₱${Number(row.total_amount).toFixed(2)}` },
      ],
    },
    tasks: {
      tab: tasksTab,
      columns: [
        { key: 'title', header: 'Title' },
        { key: 'branch_name', header: 'Branch' },
        { key: 'assigned_to_name', header: 'Assigned to' },
      ],
    },
  };

  const activeTabCounts = Object.fromEntries(
    Object.entries(tabData).map(([key, { tab }]) => [key, tab.archivedRecords.length])
  );

  return (
    <>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-dropdown border border-border bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-dropdown px-3.5 py-2 text-sm font-medium transition-colors',
              activeTab === t.key
                ? 'bg-brand text-brand-ink'
                : 'text-text-secondary hover:bg-muted'
            )}
          >
            {t.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                activeTab === t.key ? 'bg-brand-ink/10 text-brand-ink' : 'bg-muted text-text-secondary'
              )}
            >
              {activeTabCounts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {Object.entries(tabData).map(([key, { tab, columns }]) =>
        activeTab === key ? <ArchivedTabPanel key={key} tab={tab} columns={columns} /> : null
      )}
    </>
  );
}

export default function ArchivedIndex() {
  return (
    <AppLayout title="Archived Records" subtitle="Restore or permanently delete archived items">
      <Head title="Archived Records" />
      <ArchivedPageContent />
    </AppLayout>
  );
}
