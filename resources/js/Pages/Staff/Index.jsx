import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Plus, Users } from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import DataTable from '@/Components/UI/DataTable';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import Modal from '@/Components/UI/Modal';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import Button from '@/Components/UI/Button';
import Input from '@/Components/UI/Input';
import Select from '@/Components/UI/Select';
import Badge from '@/Components/UI/Badge';
import RecordDetailModal from '@/Components/Records/RecordDetailModal';
import { useArchivableRecords } from '@/lib/useArchivableRecords';
import { buildActiveActions } from '@/lib/buildActionItems';
import { sampleStaff, sampleBranches } from '@/lib/sampleRecords';

const emptyForm = { name: '', email: '', contact_number: '', role: 'staff', branch_id: sampleBranches[0]?.id ?? '' };

const roleVariant = { owner: 'brand', manager: 'warning', staff: 'neutral' };

function StaffForm({ initial, onSubmit, onCancel, submitLabel, loading }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email.';
    if (form.contact_number && !/^09\d{9}$/.test(form.contact_number)) {
      next.contact_number = 'Must be 11 digits starting with 09.';
    }
    if (form.role !== 'owner' && !form.branch_id) next.branch_id = 'Branch is required for this role.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    const branch = sampleBranches.find((b) => String(b.id) === String(form.branch_id));
    onSubmit({
      ...form,
      branch_id: form.role === 'owner' ? null : Number(form.branch_id),
      branch_name: form.role === 'owner' ? '—' : (branch?.name?.replace('Mabi Sip and Bites ', '') || ''),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full name"
        inputModeType="alpha"
        value={form.name}
        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        error={errors.name}
        placeholder="Juan Dela Cruz"
        required
      />
      <Input
        label="Email"
        inputModeType="email"
        value={form.email}
        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        error={errors.email}
        placeholder="staff@mabisipbites.test"
        required
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
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Role"
          value={form.role}
          onChange={(v) => setForm((f) => ({ ...f, role: v }))}
          required
        >
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </Select>
        <Select
          label="Branch"
          value={form.role === 'owner' ? '' : form.branch_id}
          onChange={(v) => setForm((f) => ({ ...f, branch_id: v }))}
          error={errors.branch_id}
          disabled={form.role === 'owner'}
        >
          <option value="">{form.role === 'owner' ? 'All branches' : 'Select branch'}</option>
          {sampleBranches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function StaffPageContent() {
  const {
    records, isSubmitting,
    creating, viewing, editing, archiving,
    openCreate, closeCreate, createRecord,
    openView, closeView,
    openEdit, closeEdit, updateRecord,
    openArchive, closeArchive, confirmArchive,
  } = useArchivableRecords(sampleStaff, { entityLabel: 'Staff member' });

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'branch_name', header: 'Branch' },
    { key: 'role', header: 'Role', render: (row) => <Badge variant={roleVariant[row.role]}>{row.role}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>{row.status}</Badge>,
    },
  ];

  const viewFields = [
    { key: 'name', label: 'Full name' },
    { key: 'email', label: 'Email' },
    { key: 'contact_number', label: 'Contact number' },
    { key: 'role', label: 'Role', render: (r) => <Badge variant={roleVariant[r.role]}>{r.role}</Badge> },
    { key: 'branch_name', label: 'Branch' },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge> },
    // Per 07_BACKEND_CONTROLLERS_AND_ROUTES.md "Staff Performance Metrics":
    // transaction count surfaced in the staff details modal. Only
    // meaningful for staff who actually ring up sales — owner/manager
    // rows show a dash instead of a misleading 0.
    {
      key: 'transactions_this_month',
      label: 'Transactions this month',
      render: (r) => (r.role === 'staff' ? (r.transactions_this_month ?? 0) : '—'),
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" leftIcon={<Plus className="size-4" />} onClick={openCreate}>
          Add staff
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
        emptyIcon={Users}
        emptyTitle="No staff yet"
        emptyDescription="Staff you add will appear here."
        emptyActionLabel="Add staff"
        onEmptyAction={openCreate}
      />

      <Modal isOpen={creating} onClose={closeCreate} title="Add staff" maxWidth="md">
        <StaffForm onSubmit={createRecord} onCancel={closeCreate} submitLabel="Create staff" loading={isSubmitting} />
      </Modal>

      <Modal isOpen={!!editing} onClose={closeEdit} title="Edit staff" maxWidth="md">
        {editing && (
          <StaffForm
            initial={editing}
            onSubmit={(data) => updateRecord(editing.id, data)}
            onCancel={closeEdit}
            submitLabel="Save changes"
            loading={isSubmitting}
          />
        )}
      </Modal>

      <RecordDetailModal isOpen={!!viewing} onClose={closeView} title="Staff details" record={viewing} fields={viewFields} />

      <ConfirmModal
        isOpen={!!archiving}
        onClose={closeArchive}
        onConfirm={confirmArchive}
        intent="archive"
        title="Archive this staff member?"
        description="You can restore it later from Archived Records."
        loading={isSubmitting}
      />
    </>
  );
}

export default function StaffIndex() {
  return (
    <AppLayout title="Staff" subtitle="Manage team members across both branches">
      <Head title="Staff" />
      <StaffPageContent />
    </AppLayout>
  );
}
