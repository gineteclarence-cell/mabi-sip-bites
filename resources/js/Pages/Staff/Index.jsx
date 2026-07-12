import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
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

const roleVariant = { owner: 'brand', manager: 'warning', staff: 'neutral' };

function emptyForm(defaultBranchId) {
  return { name: '', email: '', contact_number: '', role: 'staff', branch_id: defaultBranchId ?? '', password: '', password_confirmation: '' };
}

function StaffForm({ initial, onSubmit, onCancel, submitLabel, loading, isOwner, branches }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, password: '', password_confirmation: '' }
      : emptyForm(branches[0]?.id)
  );
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(
      {
        name: form.name,
        email: form.email,
        contact_number: form.contact_number,
        role: form.role,
        branch_id: form.role === 'owner' ? null : form.branch_id,
        password: form.password,
        password_confirmation: form.password_confirmation,
      },
      { onError: setErrors }
    );
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
          disabled={!isOwner}
          helpText={!isOwner ? 'Only the owner can assign manager/owner roles.' : undefined}
        >
          {isOwner && <option value="owner">Owner</option>}
          {isOwner && <option value="manager">Manager</option>}
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
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name.replace('Mabi Sip and Bites ', '')}</option>
          ))}
        </Select>
      </div>
      <Input
        label={initial ? 'New password' : 'Password'}
        inputModeType="password"
        value={form.password}
        onChange={(v) => setForm((f) => ({ ...f, password: v }))}
        error={errors.password}
        placeholder={initial ? 'Leave blank to keep current password' : 'Create a password'}
        helpText="Min 8 characters with a letter, number, and symbol"
        required={!initial}
      />
      <Input
        label="Confirm password"
        inputModeType="password"
        value={form.password_confirmation}
        onChange={(v) => setForm((f) => ({ ...f, password_confirmation: v }))}
        error={errors.password_confirmation}
        placeholder="Re-enter password"
        required={!initial && form.password !== ''}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function StaffPageContent({ staff, branches }) {
  const { props } = usePage();
  const currentRole = props.auth?.user?.role;
  const isOwner = currentRole === 'owner';

  const {
    records, isSubmitting,
    creating, viewing, editing, archiving,
    openCreate, closeCreate, createRecord,
    openView, closeView,
    openEdit, closeEdit, updateRecord,
    openArchive, closeArchive, confirmArchive,
  } = useArchivableRecords({
    records: staff,
    storeRoute: 'staff.store',
    updateRouteName: 'staff.update',
    module: 'staff',
  });

  // Server already scopes which staff a Manager can see in
  // StaffController::index(); this client-side filter is a second,
  // redundant layer so the table never shows a row whose Edit/Archive
  // would be rejected — defense in depth, not the actual boundary.
  const visibleRecords = isOwner ? records : records.filter((r) => r.role === 'staff');

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
        data={visibleRecords}
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
        <StaffForm onSubmit={createRecord} onCancel={closeCreate} submitLabel="Create staff" loading={isSubmitting} isOwner={isOwner} branches={branches} />
      </Modal>

      <Modal isOpen={!!editing} onClose={closeEdit} title="Edit staff" maxWidth="md">
        {editing && (
          <StaffForm
            initial={editing}
            onSubmit={(data, opts) => updateRecord(editing.id, data, opts)}
            onCancel={closeEdit}
            submitLabel="Save changes"
            loading={isSubmitting}
            isOwner={isOwner}
            branches={branches}
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

export default function StaffIndex({ staff }) {
  const { props } = usePage();
  const branches = props.branches || [];

  return (
    <AppLayout title="Staff" subtitle="Manage team members across both branches">
      <Head title="Staff" />
      <StaffPageContent staff={staff} branches={branches} />
    </AppLayout>
  );
}
