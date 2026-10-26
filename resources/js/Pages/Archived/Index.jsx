import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Archive } from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import DataTable from '@/Components/UI/DataTable';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import Badge from '@/Components/UI/Badge';
import { buildArchivedActions } from '@/lib/buildActionItems';
import { cn } from '@/lib/utils';

/**
 * Archived Records (real backend)
 *
 * THIS IS THE FIX for "archive works but doesn't show on the archive
 * page": the previous version called useArchivedTab(sampleX, ...) with
 * a locally-imported sample array, completely independent from whatever
 * state the Inventory/Staff/Sales/Tasks pages held in their own local
 * useState(). Archiving a product on /inventory never touched this
 * page's copy of the data, because there was no shared copy — each page
 * was its own island.
 *
 * Now: `archivedRecords` comes directly from
 * ArchiveController::index(), which queries status = 'archived' for
 * every module from the actual database. Restoring/deleting a record
 * here calls the same archive.restore / archive.destroy routes that
 * every other page's Archive button hits, and Inertia automatically
 * re-fetches this page's props afterward — so there is now exactly one
 * source of truth, not five.
 */

function useArchivedTab(initialRecords, entityLabel, module) {
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function confirmRestore() {
    if (!restoring) return;
    setIsSubmitting(true);
    router.patch(route('archive.restore', { module, id: restoring.id }), {}, {
      onSuccess: () => setRestoring(null),
      onFinish: () => setIsSubmitting(false),
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    setIsSubmitting(true);
    router.delete(route('archive.destroy', { module, id: deleting.id }), {
      onSuccess: () => setDeleting(null),
      onFinish: () => setIsSubmitting(false),
    });
  }

  return {
    archivedRecords: initialRecords,
    restoring, deleting, isSubmitting,
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

function ArchivedPageContent({ archivedRecords }) {
  const { props } = usePage();
  const currentRole = props.auth?.user?.role;
  const isOwner = currentRole === 'owner';

  const branchesTab = useArchivedTab(archivedRecords.branches || [], 'Branch', 'branches');
  const inventoryTab = useArchivedTab(archivedRecords.inventory || [], 'Product', 'inventory');
  const staffTab = useArchivedTab(archivedRecords.staff || [], 'Staff', 'staff');
  const salesTab = useArchivedTab(archivedRecords.sales || [], 'Sale', 'sales');
  const tasksTab = useArchivedTab(archivedRecords.tasks || [], 'Task', 'tasks');

  // Server already scopes the staff tab's contents in
  // ArchiveController::index() — Manager only ever receives 'staff'-role
  // archived records in the prop to begin with. This client-side filter
  // is a redundant second layer, same reasoning as the live Staff page.
  const visibleStaffArchived = isOwner
    ? staffTab.archivedRecords
    : staffTab.archivedRecords.filter((r) => r.role === 'staff');

  const allTabs = [
    { key: 'branches', label: 'Branches', ownerOnly: true },
    { key: 'inventory', label: 'Inventory', ownerOnly: false },
    { key: 'staff', label: 'Staff', ownerOnly: false },
    { key: 'sales', label: 'Sales', ownerOnly: false },
    { key: 'tasks', label: 'Tasks', ownerOnly: false },
  ];

  const allowedKeys = isOwner ? ['branches', 'staff'] : ['inventory', 'tasks'];
  const visibleTabs = allTabs.filter((t) => allowedKeys.includes(t.key));
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.key ?? 'inventory');

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
      tab: { ...staffTab, archivedRecords: visibleStaffArchived },
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
    visibleTabs.map((t) => [t.key, tabData[t.key].tab.archivedRecords.length])
  );

  return (
    <>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-dropdown border border-border bg-white p-1">
        {visibleTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-dropdown px-3.5 py-2 text-sm font-medium transition-colors',
              activeTab === t.key ? 'bg-brand text-brand-ink' : 'text-text-secondary hover:bg-muted'
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

      {visibleTabs.map((t) =>
        activeTab === t.key ? (
          <ArchivedTabPanel key={t.key} tab={tabData[t.key].tab} columns={tabData[t.key].columns} />
        ) : null
      )}
    </>
  );
}

export default function ArchivedIndex({ archivedRecords }) {
  return (
    <AppLayout title="Archived Records" subtitle="Restore or permanently delete archived items">
      <Head title="Archived Records" />
      <ArchivedPageContent archivedRecords={archivedRecords} />
    </AppLayout>
  );
}
