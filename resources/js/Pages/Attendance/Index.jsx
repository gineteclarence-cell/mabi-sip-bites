import { useState } from "react";

import { Head, router, usePage } from "@inertiajs/react";

import { CalendarCheck, Clock, LogIn, LogOut } from "lucide-react";

import AppLayout from "@/Components/Layout/AppLayout";
import ActionDropdown from "@/Components/UI/ActionDropdown";
import Badge from "@/Components/UI/Badge";
import Button from "@/Components/UI/Button";
import DataTable from "@/Components/UI/DataTable";
import Modal from "@/Components/UI/Modal";
import Select from "@/Components/UI/Select";

const statusVariant = {
    present: "success",
    late: "warning",
    absent: "danger",
};

function clockLabel(value) {
    if (!value) {
        return "—";
    }

    const [hour, minute] = value.split(":").map(Number);

    return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(2000, 0, 1, hour, minute));
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/*
|--------------------------------------------------------------------------
| Staff real-time clock card
|--------------------------------------------------------------------------
*/

function TodayClock({ attendance }) {
    const [submitting, setSubmitting] = useState(false);

    const isClockedIn = attendance?.is_clocked_in ?? false;

    function timeIn() {
        setSubmitting(true);

        router.post(
            route("attendance.time-in"),
            {},
            {
                preserveScroll: true,

                onFinish: () => setSubmitting(false),
            },
        );
    }

    function timeOut() {
        setSubmitting(true);

        router.post(
            route("attendance.time-out"),
            {},
            {
                preserveScroll: true,

                onFinish: () => setSubmitting(false),
            },
        );
    }

    return (
        <div className="mb-5 rounded-card border border-border bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Clock className="size-5" />

                        <h2 className="font-semibold">Today's attendance</h2>
                    </div>

                    <p className="mt-1 text-sm text-text-secondary">
                        Your time is recorded automatically when you click the
                        button.
                    </p>
                </div>

                <div>
                    {isClockedIn ? (
                        <Button
                            variant="primary"
                            leftIcon={<LogOut className="size-4" />}
                            onClick={timeOut}
                            loading={submitting}
                        >
                            Time out
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            leftIcon={<LogIn className="size-4" />}
                            onClick={timeIn}
                            loading={submitting}
                        >
                            Time in
                        </Button>
                    )}
                </div>
            </div>

            {attendance && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-dropdown bg-muted p-3">
                        <p className="text-xs text-text-secondary">Status</p>

                        <div className="mt-1">
                            <Badge
                                variant={
                                    statusVariant[attendance.status] ||
                                    "neutral"
                                }
                            >
                                {attendance.status}
                            </Badge>
                        </div>
                    </div>

                    <div className="rounded-dropdown bg-muted p-3">
                        <p className="text-xs text-text-secondary">Sessions</p>

                        <p className="mt-1 font-semibold">
                            {attendance.session_count}
                        </p>
                    </div>

                    <div className="rounded-dropdown bg-muted p-3">
                        <p className="text-xs text-text-secondary">Worked</p>

                        <p className="mt-1 font-semibold">
                            {attendance.worked_time}
                        </p>
                    </div>
                </div>
            )}

            {attendance?.sessions?.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-dropdown border border-border">
                    <div className="grid grid-cols-3 bg-muted px-4 py-2 text-xs font-medium text-text-secondary">
                        <span>Session</span>

                        <span>Time in</span>

                        <span>Time out</span>
                    </div>

                    {attendance.sessions.map((session, index) => (
                        <div
                            key={session.id}
                            className="grid grid-cols-3 border-t border-border px-4 py-3 text-sm"
                        >
                            <span>{index + 1}</span>

                            <span>{session.time_in_label}</span>

                            <span>
                                {session.time_out_label || "Currently working"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Attendance history detail
|--------------------------------------------------------------------------
*/

function AttendanceDetail({ attendance, onClose }) {
    if (!attendance) {
        return null;
    }

    return (
        <Modal
            isOpen={!!attendance}
            onClose={onClose}
            title="Attendance details"
            maxWidth="md"
        >
            <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <p className="text-xs text-text-secondary">Staff</p>

                        <p className="mt-1 font-medium">
                            {attendance.staff_name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Branch</p>

                        <p className="mt-1 font-medium">
                            {attendance.branch_name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Date</p>

                        <p className="mt-1 font-medium">
                            {formatDate(attendance.work_date)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Status</p>

                        <div className="mt-1">
                            <Badge
                                variant={
                                    statusVariant[attendance.status] ||
                                    "neutral"
                                }
                            >
                                {attendance.status}
                            </Badge>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">
                            Total worked
                        </p>

                        <p className="mt-1 font-medium">
                            {attendance.worked_time}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-text-secondary">Sessions</p>

                        <p className="mt-1 font-medium">
                            {attendance.session_count}
                        </p>
                    </div>
                </div>

                <div>
                    <p className="mb-2 text-sm font-semibold">Time sessions</p>

                    <div className="overflow-hidden rounded-dropdown border border-border">
                        <div className="grid grid-cols-3 bg-muted px-4 py-2 text-xs font-medium text-text-secondary">
                            <span>Session</span>

                            <span>Time in</span>

                            <span>Time out</span>
                        </div>

                        {attendance.sessions?.map((session, index) => (
                            <div
                                key={session.id}
                                className="grid grid-cols-3 border-t border-border px-4 py-3 text-sm"
                            >
                                <span>{index + 1}</span>

                                <span>{session.time_in_label}</span>

                                <span>{session.time_out_label || "—"}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function MonthlyTimesheet({ logs }) {
    const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
    const [staff, setStaff] = useState('all');
    const options = [...new Set(logs.map(log => log.staff_name))].sort();
    const [y, m] = month.split('-').map(Number);
    const days = Array.from({length: new Date(y, m, 0).getDate()}, (_,i) => `${month}-${String(i+1).padStart(2,'0')}`);
    const matching = logs.filter(log => (staff === 'all' || staff === log.staff_name) && log.work_date?.startsWith(month));
    function groupParts(log) {
        const sessions = log.sessions || [];
        const am = sessions.filter(session => session.time_in && session.time_in < '12:00');
        const pm = sessions.filter(session => session.time_in && session.time_in >= '12:00');
        return {am,pm};
    }
    const time = value => value ? clockLabel(value) : '—';
    return <div className="mt-5 rounded-card border border-border bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Monthly attendance timesheet</h3>
            <div className="flex gap-2">
                <input aria-label="Timesheet month" type="month" value={month} onChange={e=>setMonth(e.target.value)} className="rounded border border-border px-2" />
                <select aria-label="Timesheet staff" className="rounded border border-border px-2" value={staff} onChange={e=>setStaff(e.target.value)}>
                    <option value="all">All staff</option>{options.map(name=><option key={name} value={name}>{name}</option>)}
                </select>
            </div>
        </div>
        <p className="mb-2 text-xs text-text-secondary">Shop 9:00 AM–10:00 PM · Late after 9:15 AM · Unpaid lunch 12:00–1:00 PM. Absences appear after daily close.</p>
        <div className="max-h-[60vh] overflow-auto">
            <table className="w-full min-w-[850px] text-xs">
                <thead className="sticky top-0 bg-yellow-100 text-left"><tr>
                    {['Date','Staff','AM in','AM out','PM in','PM out','Late','Overtime (mins)','Status','Remarks'].map(h=><th key={h} className="border p-2">{h}</th>)}
                </tr></thead>
                <tbody>{days.flatMap(day => {
                    const daily = matching.filter(log => log.work_date === day);
                    return (daily.length ? daily : [{id:day, work_date:day, staff_name:staff==='all' ? '—' : staff, status:'—',sessions:[]}]).map(log => {
                        const {am,pm} = groupParts(log);
                        const crossesLunch = (log.sessions || []).some(entry => entry.time_in && entry.time_in < '12:00' && (!entry.time_out || entry.time_out > '13:00'));
                        const first = log.time_in || am[0]?.time_in || pm[0]?.time_in;
                        const last = log.time_out;
                        const overtime = last && last > '22:00' ? Math.max(0,Number(last.slice(0,2))*60+Number(last.slice(3,5))-22*60) : 0;
                        return <tr key={`${day}-${log.id}`} className="even:bg-yellow-50"><td className="border p-2">{day}</td><td className="border p-2">{log.staff_name}</td>
                            <td className="border p-2">{time(am[0]?.time_in)}</td><td className="border p-2">{crossesLunch ? '12:00 (break)' : time(am.at(-1)?.time_out)}</td>
                            <td className="border p-2">{crossesLunch ? '13:00 (auto)' : time(pm[0]?.time_in)}</td><td className="border p-2">{crossesLunch ? time(log.time_out) : time(pm.at(-1)?.time_out)}</td>
                            <td className="border p-2">{log.status === 'late' ? 'Late' : '—'}</td><td className="border p-2">{overtime || '—'}</td>
                            <td className="border p-2 font-semibold">{log.status}</td><td className="border p-2">{log.status==='absent'?'No clock-in':' '}</td>
                        </tr>;
                    });
                })}</tbody>
            </table>
        </div>
    </div>;
}

export default function AttendanceIndex({
    attendanceLogs = [],
    staffOptions = [],
    todayAttendance = null,
    filters = {},
    permissions = {},
    selectedBranchId = null,
}) {
    const { props } = usePage();

    const [viewing, setViewing] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | Staff filter
    |--------------------------------------------------------------------------
    |
    | Preserve branch_id when changing staff filter.
    |
    */

    function filterStaff(value) {
        const params = new URLSearchParams(window.location.search);

        if (value) {
            params.set("staff_id", value);
        } else {
            params.delete("staff_id");
        }

        router.get(
            window.location.pathname,
            Object.fromEntries(params.entries()),
            {
                preserveState: true,

                preserveScroll: true,

                replace: true,
            },
        );
    }

    const columns = [
        {
            key: "staff_name",
            header: "Staff",
        },

        {
            key: "branch_name",
            header: "Branch",
        },

        {
            key: "work_date",
            header: "Date",

            render: (row) => formatDate(row.work_date),
        },

        {
            key: "time_in",
            header: "First time in",

            render: (row) => clockLabel(row.time_in),
        },

        {
            key: "time_out",
            header: "Last time out",

            render: (row) => clockLabel(row.time_out),
        },

        {
            key: "session_count",
            header: "Sessions",
        },

        {
            key: "worked_time",
            header: "Worked",
        },

        {
            key: "status",
            header: "Status",

            render: (row) => (
                <Badge variant={statusVariant[row.status] || "neutral"}>
                    {row.status}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout
            title="Attendance"
            subtitle={
                permissions.is_staff
                    ? "Real-time time-in and time-out"
                    : permissions.is_owner
                      ? selectedBranchId
                          ? "Attendance for the selected branch"
                          : "Attendance across both branches"
                      : "Attendance for your branch"
            }
        >
            <Head title="Attendance" />

            {/* Staff real-time clock */}
            {permissions.can_clock && (
                <TodayClock attendance={todayAttendance} />
            )}

            {/* Staff filter */}
            {!permissions.is_staff && (
                <div className="mb-4 flex">
                    <div className="w-full sm:w-64">
                        <Select
                            label="Filter by staff"
                            value={filters.staff_id || ""}
                            onChange={filterStaff}
                        >
                            <option value="">All staff</option>

                            {staffOptions.map((staff) => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            )}

            <DataTable
                columns={columns}
                data={attendanceLogs}
                actions={(row) => (
                    <ActionDropdown
                        items={[
                            {
                                key: "view",

                                label: "View",

                                onClick: () => setViewing(row),
                            },
                        ]}
                    />
                )}
                emptyIcon={CalendarCheck}
                emptyTitle="No attendance logs"
                emptyDescription="No attendance records match this view."
            />

            <MonthlyTimesheet logs={attendanceLogs} />

            <AttendanceDetail
                attendance={viewing}
                onClose={() => setViewing(null)}
            />
        </AppLayout>
    );
}
