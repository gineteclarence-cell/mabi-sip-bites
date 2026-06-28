import { Link } from '@inertiajs/react';
import Badge from '@/Components/UI/Badge';

const statusVariant = {
  present: 'success',
  late: 'warning',
  absent: 'danger',
  incomplete: 'neutral',
};

const statusLabel = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  incomplete: 'Incomplete',
};

/**
 * AttendanceSummary
 *
 * Usage:
 *   <AttendanceSummary records={dashboardData.attendanceSummary} />
 */
export default function AttendanceSummary({ records }) {
  return (
    <div className="rounded-card border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Attendance today</h3>
          <p className="mt-0.5 text-xs text-text-secondary">Staff check-ins across both branches</p>
        </div>
        <Link href="/attendance" className="text-xs font-medium text-brand-ink hover:underline">
          View all
        </Link>
      </div>

      <div className="mt-4 space-y-2.5">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between rounded-dropdown border border-border px-3.5 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">{record.staffName}</p>
              <p className="text-xs text-text-secondary">
                {record.branchName} · In {record.timeIn}
              </p>
            </div>
            <Badge variant={statusVariant[record.status] || 'neutral'}>
              {statusLabel[record.status] || record.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
