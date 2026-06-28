import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Plus, Building2 } from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import DataTable from '@/Components/UI/DataTable';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import Modal from '@/Components/UI/Modal';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import Button from '@/Components/UI/Button';
import Input from '@/Components/UI/Input';
import Badge from '@/Components/UI/Badge';
import RecordDetailModal from '@/Components/Records/RecordDetailModal';
import { useArchivableRecords } from '@/lib/useArchivableRecords';
import { buildActiveActions } from '@/lib/buildActionItems';
import { sampleBranches } from '@/lib/sampleRecords';

const emptyForm = { name: '', location: '', contact_number: '' };

function BranchForm({ initial, onSubmit, onCancel, submitLabel, loading }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Branch name is required.';
    if (form.contact_number && !/^09\d{9}$/.test(form.contact_number)) {
      next.contact_number = 'Must be 11 digits starting with 09.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Branch name"
        inputModeType="text"
        value={form.name}
        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        error={errors.name}
        placeholder="Mabi Sip and Bites Branch 3"
        required
      />
      <Input
        label="Location"
        value={form.location}
        onChange={(v) => setForm((f) => ({ ...f, location: v }))}
        placeholder="City, Province"
      />
      <Input
        label="Contact number"
        inputModeType="contact"
        value={form.contact_number}
        onChange={(v) => setForm((f) => ({ ...f, contact_number: v }))}
        error={errors.contact_number}
        placeholder="09171234567"
        helpText="11 digits, starts with 09"
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}

/**
 * BranchesPageContent
 *
 * IMPORTANT: this inner component is what actually calls useArchivableRecords
 * (and therefore useToast internally). It is rendered as a CHILD of AppLayout
 * below, which means it mounts underneath AppLayout's <ToastProvider> in the
 * React tree. If useArchivableRecords were called directly inside the default
 * exported page component (as a sibling-in-time to <AppLayout>, not a
 * descendant of it), useToast() would throw because no ToastProvider
 * ancestor exists yet at that point in the tree. Every page in this phase
 * follows this same two-part split for that reason.
 */
function BranchesPageContent() {
  const {
    records, isSubmitting,
    creating, viewing, editing, archiving,
    openCreate, closeCreate, createRecord,
    openView, closeView,
    openEdit, closeEdit, updateRecord,
    openArchive, closeArchive, confirmArchive,
  } = useArchivableRecords(sampleBranches, { entityLabel: 'Branch' });

  const columns = [
    { key: 'name', header: 'Branch' },
    { key: 'location', header: 'Location' },
    { key: 'contact_number', header: 'Contact number' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>{row.status}</Badge>,
    },
  ];

  const viewFields = [
    { key: 'name', label: 'Branch name' },
    { key: 'location', label: 'Location' },
    { key: 'contact_number', label: 'Contact number' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge> },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" leftIcon={<Plus className="size-4" />} onClick={openCreate}>
          Add branch
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={records}
        actions={(row) => (
          <ActionDropdown
            items={buildActiveActions({
              onView: () => openView(row),
              onEdit: () => openEdit(row),
              onArchive: () => openArchive(row),
            })}
          />
        )}
        emptyIcon={Building2}
        emptyTitle="No branches yet"
        emptyDescription="Branches you add will appear here."
        emptyActionLabel="Add branch"
        onEmptyAction={openCreate}
      />

      <Modal isOpen={creating} onClose={closeCreate} title="Add branch" maxWidth="sm">
        <BranchForm onSubmit={createRecord} onCancel={closeCreate} submitLabel="Create branch" loading={isSubmitting} />
      </Modal>

      <Modal isOpen={!!editing} onClose={closeEdit} title="Edit branch" maxWidth="sm">
        {editing && (
          <BranchForm
            initial={editing}
            onSubmit={(data) => updateRecord(editing.id, data)}
            onCancel={closeEdit}
            submitLabel="Save changes"
            loading={isSubmitting}
          />
        )}
      </Modal>

      <RecordDetailModal isOpen={!!viewing} onClose={closeView} title="Branch details" record={viewing} fields={viewFields} />

      <ConfirmModal
        isOpen={!!archiving}
        onClose={closeArchive}
        onConfirm={confirmArchive}
        intent="archive"
        title="Archive this branch?"
        description="You can restore it later from Archived Records."
        loading={isSubmitting}
      />
    </>
  );
}

export default function BranchesIndex() {
  return (
    <AppLayout title="Branches" subtitle="Manage Mabi Sip & Bites branch locations">
      <Head title="Branches" />
      <BranchesPageContent />
    </AppLayout>
  );
}
