import { Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
import Badge from '@/Components/UI/Badge';

const priorityVariant = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

function formatDueDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * PendingTasksPanel
 *
 * Usage:
 *   <PendingTasksPanel tasks={dashboardData.pendingTasksList} />
 */
export default function PendingTasksPanel({ tasks }) {
  return (
    <div className="rounded-card border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Pending tasks</h3>
          <p className="mt-0.5 text-xs text-text-secondary">Open items assigned to staff</p>
        </div>
        <Link href="/tasks" className="text-xs font-medium text-brand-ink hover:underline">
          View all
        </Link>
      </div>

      <div className="mt-4 space-y-2.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between rounded-dropdown border border-border px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{task.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                <Calendar className="size-3" />
                {task.branchName} · {task.assignedTo} · Due {formatDueDate(task.dueDate)}
              </p>
            </div>
            <Badge variant={priorityVariant[task.priority] || 'neutral'} className="shrink-0">
              {task.priority}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
