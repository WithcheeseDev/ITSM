import type { Activity } from '@/domain/types';
import { formatDateTime } from '@/shared/components/format';

/**
 * US-029 — Task Type, Subject, Scheduled Start/End, Status, Owner, Action Plan.
 * Shown as one labelled block per activity: the blueprint puts Activities in the 1/3 side column,
 * too narrow for a 6-column table.
 */
export function ActivityTable({ activities, userName }: { activities: readonly Activity[]; userName: (id: string) => string }) {
  if (activities.length === 0) return <p className="text-muted-foreground">ยังไม่มีกิจกรรม</p>;
  const sorted = [...activities].sort((a, b) => Date.parse(a.scheduledStart) - Date.parse(b.scheduledStart));

  return (
    <ul className="flex flex-col gap-[var(--space-3)]">
      {sorted.map((a) => (
        <li key={a.id} className="rounded-[var(--radius-md)] bg-surface-sunken p-[var(--space-3)]">
          <p className="font-medium">{a.subject}</p>
          <dl className="mt-[var(--space-2)] grid grid-cols-[auto_1fr] gap-x-[var(--space-3)] gap-y-[var(--space-1)] text-[length:var(--fs-sm)]">
            <dt className="text-muted-foreground">Task Type</dt>
            <dd>{a.taskType}</dd>
            <dt className="text-muted-foreground">Scheduled</dt>
            <dd className="tabular-nums">
              {formatDateTime(a.scheduledStart)} – {formatDateTime(a.scheduledEnd)}
            </dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{a.status}</dd>
            <dt className="text-muted-foreground">Owner</dt>
            <dd>{userName(a.ownerId)}</dd>
            <dt className="text-muted-foreground">Action Plan</dt>
            <dd className="whitespace-pre-wrap">{a.actionPlan || '—'}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
