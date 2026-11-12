import { CircleCheck, CircleDot, CircleSlash, CircleX, Clock, Loader, type LucideIcon } from 'lucide-react';
import type { Status } from '@/domain/types';
import { cn } from '@/lib/utils';

export type StatusGroup = 'new' | 'progress' | 'waiting' | 'resolved' | 'closed' | 'rejected';

/** design-system §4 — meaning never by colour alone: each group has its own icon shape + the status label. */
const GROUP_OF: Record<Status, StatusGroup> = {
  New: 'new', 'Request Submitted': 'new', Draft: 'new', 'Request For Change': 'new',
  Assigned: 'progress', 'In Process': 'progress', 'Re-Opened': 'progress', 'Request In-Progress': 'progress',
  'Under Review': 'progress', 'Scheduled for Review': 'progress', Implementation: 'progress', 'Department Accepted': 'progress',
  'Head Approved': 'progress', 'Ready for CAB': 'progress', 'Root Cause Identify': 'progress', 'Known Error': 'progress',
  'Resolution Identify': 'progress', Monitoring: 'progress', Delivered: 'progress',
  Pending: 'waiting', 'Waiting For Approve': 'waiting', 'Waiting for return': 'waiting',
  Resolved: 'resolved', 'Request Completed': 'resolved', Completed: 'resolved',
  Closed: 'closed', Cancelled: 'closed', 'Request Cancelled': 'closed',
  'Department Declined': 'rejected', 'Head Rejected': 'rejected', Failed: 'rejected',
};

const STYLE: Record<StatusGroup, { icon: LucideIcon; className: string }> = {
  new: { icon: CircleDot, className: 'bg-[var(--status-new-bg)] text-[var(--status-new-fg)]' },
  progress: { icon: Loader, className: 'bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]' },
  waiting: { icon: Clock, className: 'bg-[var(--status-waiting-bg)] text-[var(--status-waiting-fg)]' },
  resolved: { icon: CircleCheck, className: 'bg-[var(--status-resolved-bg)] text-[var(--status-resolved-fg)]' },
  closed: { icon: CircleSlash, className: 'bg-[var(--status-closed-bg)] text-[var(--status-closed-fg)]' },
  rejected: { icon: CircleX, className: 'bg-[var(--status-rejected-bg)] text-[var(--status-rejected-fg)]' },
};

export const statusGroup = (status: Status): StatusGroup => GROUP_OF[status];

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { icon: Icon, className: tone } = STYLE[GROUP_OF[status]];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[var(--space-1)] rounded-[var(--badge-radius)] px-[var(--badge-padding-x)] py-0.5 text-[length:var(--fs-sm)] font-medium whitespace-nowrap',
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" strokeWidth={2} className="size-[var(--icon-sm)] shrink-0" />
      {status}
    </span>
  );
}
