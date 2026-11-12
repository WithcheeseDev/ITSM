import { AlertOctagon, AlertTriangle, Hourglass } from 'lucide-react';
import { timeLeft, type TimeLeftInput } from '@/domain/sla';
import { cn } from '@/lib/utils';

const pill =
  'inline-flex items-center gap-[var(--space-1)] rounded-[var(--badge-radius)] px-[var(--badge-padding-x)] py-0.5 text-[length:var(--fs-sm)] font-medium whitespace-nowrap tabular-nums';

/** design-system §4 Time Left: normal = text · < 25% = warning · overdue = "เลยกำหนด" · awaiting approval = "รออนุมัติ" */
export function TimeLeft({ className, ...input }: TimeLeftInput & { className?: string }) {
  const t = timeLeft(input);
  switch (t.kind) {
    case 'awaiting':
      return (
        <span className={cn(pill, 'bg-muted text-muted-foreground', className)}>
          <Hourglass aria-hidden="true" className="size-[var(--icon-sm)] shrink-0" />
          รออนุมัติ
        </span>
      );
    case 'overdue':
      return (
        <span className={cn(pill, 'bg-destructive-soft text-destructive-soft-foreground', className)}>
          <AlertOctagon aria-hidden="true" className="size-[var(--icon-sm)] shrink-0" />
          เลยกำหนด {t.label}
        </span>
      );
    case 'warning':
      return (
        <span className={cn(pill, 'bg-warning-soft text-warning-soft-foreground', className)}>
          <AlertTriangle aria-hidden="true" className="size-[var(--icon-sm)] shrink-0" />
          <span className="sr-only">ใกล้ครบกำหนด </span>
          {t.label}
        </span>
      );
    default:
      return <span className={cn('whitespace-nowrap tabular-nums text-[length:var(--fs-sm)]', t.kind !== 'ok' && 'text-muted-foreground', className)}>{t.label}</span>;
  }
}
