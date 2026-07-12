import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Plus, ListTodo } from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import DataTable from '@/Components/UI/DataTable';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import Modal from '@/Components/UI/Modal';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import Button from '@/Components/UI/Button';
import Input from '@/Components/UI/Input';
import Select from '@/Components/UI/Select';
import Textarea from '@/Components/UI/Textarea';
import Badge from '@/Components/UI/Badge';
import RecordDetailModal from '@/Components/Records/RecordDetailModal';
import { useArchivableRecords } from '@/lib/useArchivableRecords';
import { buildActiveActions } from '@/lib/buildActionItems';

const priorityVariant = { high: 'danger', medium: 'warning', low: 'neutral' };
const statusVariant = { pending: 'neutral', in_progress: 'warning', completed: 'success' };
const statusLabel = { pending: 'Pending', in_progress: 'In progress', completed: 'Completed' };

function emptyForm(defaultBranchId) {
  return {
    title: '', description: '', branch_id: defaultBranchId ?? '',
    assigned_to: '', priority: 'medium', status: 'pending', due_date: '',
  };
}

function TaskForm({ initial, onSubmit, onCancel, submitLabel, loading, branches, staffOptions }) {
  const [form, setForm] = useState(initial || emptyForm(branches[0]?.id));
  const [errors, setErrors] = useState({});

  const branchStaff = staffOptions.filter((s) => String(s.branch_id) === String(form.branch_id));

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(
      {
        title: form.title,
        description: form.description,
        branch_id: form.branch_id,
        assigned_to: form.assigned_to,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date,
      },
      { onError: setErrors }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={form.title}
        onChange={(v) => setForm((f) => ({ ...f, title: v }))}
        error={errors.title}
        placeholder="Restock milk tea supplies"
        required
      />

      <Textarea
        label="Description"
        value={form.description}
        onChange={(v) => setForm((f) => ({ ...f, description: v }))}
        placeholder="Optional details about this task"
        rows={3}
      />

      <Select
        label="Branch"
        value={form.branch_id}
        onChange={(v) => setForm((f) => ({ ...f, branch_id: v, assigned_to: '' }))}
        error={errors.branch_id}
        required
      >
        <option value="">Select branch</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>{b.name.replace('Mabi Sip and Bites ', '')}</option>
        ))}
      </Select>

      <Select
        label="Assigned staff"
        value={form.assigned_to}
        onChange={(v) => setForm((f) => ({ ...f, assigned_to: v }))}
        error={errors.assigned_to}
        required
      >
        <option value="">Select staff</option>
        {branchStaff.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Priority"
          value={form.priority}
          onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
        <Select
          label="Status"
          value={form.status}
          onChange={(v) => setForm((f) => ({ ...f, status: v }))}
          required
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      <Input
        label="Due date"
        type="date"
        value={form.due_date}
        onChange={(v) => setForm((f) => ({ ...f, due_date: v }))}
        error={errors.due_date}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function TasksPageContent({ tasks, branches, staffOptions }) {
  const {
    records, isSubmitting,
    creating, viewing, editing, archiving,
    openCreate, closeCreate, createRecord,
    openView, closeView,
    openEdit, closeEdit, updateRecord,
    openArchive, closeArchive, confirmArchive,
  } = useArchivableRecords({
    records: tasks,
    storeRoute: 'tasks.store',
    updateRouteName: 'tasks.update',
    module: 'tasks',
  });

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'branch_name', header: 'Branch' },
    { key: 'assigned_to_name', header: 'Assigned to' },
    { key: 'priority', header: 'Priority', render: (row) => <Badge variant={priorityVariant[row.priority]}>{row.priority}</Badge> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge> },
    { key: 'due_date', header: 'Due date' },
  ];

  const viewFields = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description', render: (r) => r.description || '—' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'assigned_to_name', label: 'Assigned to' },
    { key: 'assigned_by_name', label: 'Assigned by', render: (r) => r.assigned_by_name || '—' },
    { key: 'priority', label: 'Priority', render: (r) => <Badge variant={priorityVariant[r.priority]}>{r.priority}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge> },
    { key: 'due_date', label: 'Due date' },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" leftIcon={<Plus className="size-4" />} onClick={openCreate}>
          Assign task
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
        emptyIcon={ListTodo}
        emptyTitle="No tasks yet"
        emptyDescription="Tasks you assign will appear here."
        emptyActionLabel="Assign task"
        onEmptyAction={openCreate}
      />

      <Modal isOpen={creating} onClose={closeCreate} title="Assign task" maxWidth="md">
        <TaskForm onSubmit={createRecord} onCancel={closeCreate} submitLabel="Create task" loading={isSubmitting} branches={branches} staffOptions={staffOptions} />
      </Modal>

      <Modal isOpen={!!editing} onClose={closeEdit} title="Edit task" maxWidth="md">
        {editing && (
          <TaskForm
            initial={editing}
            onSubmit={(data, opts) => updateRecord(editing.id, data, opts)}
            onCancel={closeEdit}
            submitLabel="Save changes"
            loading={isSubmitting}
            branches={branches}
            staffOptions={staffOptions}
          />
        )}
      </Modal>

      <RecordDetailModal isOpen={!!viewing} onClose={closeView} title="Task details" record={viewing} fields={viewFields} />

      <ConfirmModal
        isOpen={!!archiving}
        onClose={closeArchive}
        onConfirm={confirmArchive}
        intent="archive"
        title="Archive this task?"
        description="You can restore it later from Archived Records."
        loading={isSubmitting}
      />
    </>
  );
}

export default function TasksIndex({ tasks, staffOptions = [] }) {
  const { props } = usePage();
  const branches = props.branches || [];

  return (
    <AppLayout title="Tasks" subtitle="Assign and track staff tasks">
      <Head title="Tasks" />
      <TasksPageContent tasks={tasks} branches={branches} staffOptions={staffOptions} />
    </AppLayout>
  );
}
