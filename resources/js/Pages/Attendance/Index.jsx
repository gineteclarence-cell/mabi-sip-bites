import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, CalendarCheck } from 'lucide-react';
import AppLayout from '@/Components/Layout/AppLayout';
import DataTable from '@/Components/UI/DataTable';
import ActionDropdown from '@/Components/UI/ActionDropdown';
import Modal from '@/Components/UI/Modal';
import Button from '@/Components/UI/Button';
import Input from '@/Components/UI/Input';
import Select from '@/Components/UI/Select';
import Textarea from '@/Components/UI/Textarea';
import Badge from '@/Components/UI/Badge';
import RecordDetailModal from '@/Components/Records/RecordDetailModal';

const statusVariant = { present: 'success', late: 'warning', absent: 'danger', incomplete: 'neutral' };

function toTimeInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function emptyForm(defaultBranchId) {
  return {
    user_id: '', branch_id: defaultBranchId ?? '',
    work_date: new Date().toISOString().slice(0, 10),
    time_in: '', time_out: '', status: 'present', remarks: '',
  };
}

function AttendanceForm({ initial, onSubmit, onCancel, submitLabel, loading, branches, staffOptions }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, time_in: toTimeInputValue(initial.time_in), time_out: toTimeInputValue(initial.time_out) }
      : emptyForm(branches[0]?.id)
  );
  const [errors, setErrors] = useState({});

  const branchStaff = staffOptions.filter((s) => String(s.branch_id) === String(form.branch_id));

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(
      {
        user_id: form.user_id,
        branch_id: form.branch_id,
        work_date: form.work_date,
        time_in: form.time_in ? `${form.work_date} ${form.time_in}:00` : null,
        time_out: form.time_out ? `${form.work_date} ${form.time_out}:00` : null,
        status: form.status,
        remarks: form.remarks,
      },
      { onError: setErrors }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Branch"
        value={form.branch_id}
        onChange={(v) => setForm((f) => ({ ...f, branch_id: v, user_id: '' }))}
        error={errors.branch_id}
        required
      >
        <option value="">Select branch</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>{b.name.replace('Mabi Sip and Bites ', '')}</option>
        ))}
      </Select>

      <Select
        label="Staff"
        value={form.user_id}
        onChange={(v) => setForm((f) => ({ ...f, user_id: v }))}
        error={errors.user_id}
        required
      >
        <option value="">Select staff</option>
        {branchStaff.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </Select>

      <Input
        label="Date"
        type="date"
        value={form.work_date}
        onChange={(v) => setForm((f) => ({ ...f, work_date: v }))}
        error={errors.work_date}
        required
        disabled={!!initial}
        helpText={initial ? 'Date cannot be changed once logged' : undefined}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Time in"
          type="time"
          value={form.time_in}
          onChange={(v) => setForm((f) => ({ ...f, time_in: v }))}
        />
        <Input
          label="Time out"
          type="time"
          value={form.time_out}
          onChange={(v) => setForm((f) => ({ ...f, time_out: v }))}
        />
      </div>

      <Select
        label="Status"
        value={form.status}
        onChange={(v) => setForm((f) => ({ ...f, status: v }))}
        required
      >
        <option value="present">Present</option>
        <option value="late">Late</option>
        <option value="absent">Absent</option>
        <option value="incomplete">Incomplete</option>
      </Select>

      <Textarea
        label="Remarks"
        value={form.remarks}
        onChange={(v) => setForm((f) => ({ ...f, remarks: v }))}
        placeholder="Optional notes"
        rows={3}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}

function AttendancePageContent({ attendanceLogs, branches, staffOptions }) {
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function createRecord(data, { onError } = {}) {
    setIsSubmitting(true);
    router.post(route('attendance.store'), data, {
      onSuccess: () => setCreating(false),
      onError,
      onFinish: () => setIsSubmitting(false),
    });
  }

  function updateRecord(id, data, { onError } = {}) {
    setIsSubmitting(true);
    router.patch(route('attendance.update', id), data, {
      onSuccess: () => setEditing(null),
      onError,
      onFinish: () => setIsSubmitting(false),
    });
  }

  const columns = [
    { key: 'staff_name', header: 'Staff' },
    { key: 'branch_name', header: 'Branch' },
    { key: 'work_date', header: 'Date' },
    { key: 'time_in', header: 'Time in', render: (row) => (row.time_in ? new Date(row.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—') },
    { key: 'time_out', header: 'Time out', render: (row) => (row.time_out ? new Date(row.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—') },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge> },
  ];

  const viewFields = [
    { key: 'staff_name', label: 'Staff' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'work_date', label: 'Date' },
    { key: 'time_in', label: 'Time in', render: (r) => (r.time_in ? new Date(r.time_in).toLocaleTimeString() : '—') },
    { key: 'time_out', label: 'Time out', render: (r) => (r.time_out ? new Date(r.time_out).toLocaleTimeString() : '—') },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={statusVariant[r.status]}>{r.status}</Badge> },
    { key: 'remarks', label: 'Remarks', render: (r) => r.remarks || '—' },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" leftIcon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
          Log attendance
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={attendanceLogs}
        actions={(row) => (
          <ActionDropdown
            items={[
              { key: 'view', label: 'View', onClick: () => setViewing(row) },
              { key: 'edit', label: 'Edit', onClick: () => setEditing(row) },
            ]}
          />
        )}
        emptyIcon={CalendarCheck}
        emptyTitle="No attendance logs yet"
        emptyDescription="Attendance records will appear here."
        emptyActionLabel="Log attendance"
        onEmptyAction={() => setCreating(true)}
      />

      <Modal isOpen={creating} onClose={() => setCreating(false)} title="Log attendance" maxWidth="md">
        <AttendanceForm onSubmit={createRecord} onCancel={() => setCreating(false)} submitLabel="Save log" loading={isSubmitting} branches={branches} staffOptions={staffOptions} />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit attendance" maxWidth="md">
        {editing && (
          <AttendanceForm
            initial={editing}
            onSubmit={(data, opts) => updateRecord(editing.id, data, opts)}
            onCancel={() => setEditing(null)}
            submitLabel="Save changes"
            loading={isSubmitting}
            branches={branches}
            staffOptions={staffOptions}
          />
        )}
      </Modal>

      <RecordDetailModal isOpen={!!viewing} onClose={() => setViewing(null)} title="Attendance details" record={viewing} fields={viewFields} />
    </>
  );
}

export default function AttendanceIndex({ attendanceLogs, staffOptions = [] }) {
  const { props } = usePage();
  const branches = props.branches || [];

  return (
    <AppLayout title="Attendance" subtitle="Staff time-in and time-out records">
      <Head title="Attendance" />
      <AttendancePageContent attendanceLogs={attendanceLogs} branches={branches} staffOptions={staffOptions} />
    </AppLayout>
  );
}
