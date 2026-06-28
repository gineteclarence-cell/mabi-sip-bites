import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Plus, CalendarCheck } from 'lucide-react';
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
import { useToast } from '@/Components/UI/ToastProvider';
import { sampleAttendance, sampleBranches, sampleStaff } from '@/lib/sampleRecords';

const statusVariant = { present: 'success', late: 'warning', absent: 'danger', incomplete: 'neutral' };

function toTimeInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function combineDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

function emptyForm() {
  return {
    user_id: '', branch_id: sampleBranches[0]?.id ?? '',
    work_date: new Date().toISOString().slice(0, 10),
    time_in: '', time_out: '', status: 'present', remarks: '',
  };
}

function AttendanceForm({ initial, onSubmit, onCancel, submitLabel, loading }) {
  const [form, setForm] = useState(
    initial
      ? {
          ...initial,
          time_in: toTimeInputValue(initial.time_in),
          time_out: toTimeInputValue(initial.time_out),
        }
      : emptyForm()
  );
  const [errors, setErrors] = useState({});

  const branchStaff = sampleStaff.filter((s) => String(s.branch_id) === String(form.branch_id));

  function validate() {
    const next = {};
    if (!form.user_id) next.user_id = 'Staff is required.';
    if (!form.branch_id) next.branch_id = 'Branch is required.';
    if (!form.work_date) next.work_date = 'Date is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    const staff = sampleStaff.find((s) => String(s.id) === String(form.user_id));
    const branch = sampleBranches.find((b) => String(b.id) === String(form.branch_id));

    onSubmit({
      ...form,
      user_id: Number(form.user_id),
      staff_name: staff?.name || '',
      branch_id: Number(form.branch_id),
      branch_name: branch?.name?.replace('Mabi Sip and Bites ', '') || '',
      time_in: combineDateTime(form.work_date, form.time_in),
      time_out: combineDateTime(form.work_date, form.time_out),
    });
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
        {sampleBranches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
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

/**
 * Attendance has no archive/restore/delete flow — per 02_DATABASE_DESIGN.md,
 * attendance_logs has no `status: archived` or `archived_at` column (unlike
 * every other entity). It only has the present/late/absent/incomplete
 * status enum, which is operational data, not a soft-delete flag. So this
 * page only implements Create, View, Edit — matching the DB design exactly
 * rather than inventing an archive concept the schema doesn't support.
 */
export default function AttendanceIndex() {
  return (
    <AppLayout title="Attendance" subtitle="Staff time-in and time-out records">
      <Head title="Attendance" />
      <AttendancePageContent />
    </AppLayout>
  );
}

function AttendancePageContent() {
  const { showToast } = useToast();
  const [allRecords, setAllRecords] = useState(sampleAttendance);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function createRecord(data) {
    setIsSubmitting(true);
    setAllRecords((current) => [{ id: Date.now(), ...data }, ...current]);
    setIsSubmitting(false);
    setCreating(false);
    showToast({ type: 'success', title: 'Attendance log created successfully.' });
  }

  function updateRecord(id, data) {
    setIsSubmitting(true);
    setAllRecords((current) => current.map((r) => (r.id === id ? { ...r, ...data } : r)));
    setIsSubmitting(false);
    setEditing(null);
    showToast({ type: 'success', title: 'Attendance log updated successfully.' });
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
        data={allRecords}
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
        <AttendanceForm onSubmit={createRecord} onCancel={() => setCreating(false)} submitLabel="Save log" loading={isSubmitting} />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit attendance" maxWidth="md">
        {editing && (
          <AttendanceForm
            initial={editing}
            onSubmit={(data) => updateRecord(editing.id, data)}
            onCancel={() => setEditing(null)}
            submitLabel="Save changes"
            loading={isSubmitting}
          />
        )}
      </Modal>

      <RecordDetailModal isOpen={!!viewing} onClose={() => setViewing(null)} title="Attendance details" record={viewing} fields={viewFields} />
    </>
  );
}
