import { CircleCheck, CircleX, Clock, type LucideIcon } from 'lucide-react';
import { APPROVAL_TYPES, type Approval, type ApprovalDecision } from '@/domain/types';
import { formatDateTime } from '@/shared/components/format';

const DECISION: Record<ApprovalDecision, { label: string; icon: LucideIcon; className: string }> = {
  pending: { label: 'รอพิจารณา', icon: Clock, className: 'bg-[var(--status-waiting-bg)] text-[var(--status-waiting-fg)]' },
  approved: { label: 'อนุมัติ', icon: CircleCheck, className: 'bg-[var(--status-resolved-bg)] text-[var(--status-resolved-fg)]' },
  rejected: { label: 'ปฏิเสธ', icon: CircleX, className: 'bg-[var(--status-rejected-bg)] text-[var(--status-rejected-fg)]' },
};

/** US-023 — approval steps in chain order (Department → Head) with each step's result. */
export function ApprovalSteps({ approvals, userName }: { approvals: readonly Approval[]; userName: (id: string) => string }) {
  const steps = [...approvals].sort((a, b) => APPROVAL_TYPES.indexOf(a.approvalType) - APPROVAL_TYPES.indexOf(b.approvalType));

  return (
    <ol className="flex flex-col gap-[var(--space-4)]">
      {steps.map((a, i) => {
        const d = DECISION[a.decision];
        return (
          <li key={a.id} className="flex gap-[var(--space-3)]">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[length:var(--fs-xs)] font-semibold tabular-nums"
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
                <span className="font-medium">{a.approvalType}</span>
                <span
                  className={`inline-flex items-center gap-[var(--space-1)] rounded-[var(--badge-radius)] px-[var(--badge-padding-x)] py-0.5 text-[length:var(--fs-sm)] font-medium ${d.className}`}
                >
                  <d.icon aria-hidden="true" className="size-[var(--icon-sm)]" />
                  {d.label}
                </span>
              </div>
              <p className="text-[length:var(--fs-sm)] text-muted-foreground">
                {userName(a.approverId)}
                {a.decidedAt && ` · ${formatDateTime(a.decidedAt)}`}
              </p>
              {a.comment && <p className="mt-[var(--space-1)] text-[length:var(--fs-sm)] whitespace-pre-wrap">{a.comment}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
