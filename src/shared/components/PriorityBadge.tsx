import { ChevronDown, ChevronsUp, ChevronUp, Minus, type LucideIcon } from 'lucide-react';
import type { Priority } from '@/domain/types';
import { cn } from '@/lib/utils';

/** design-system §4 — label "P1" always shown; icon direction carries the meaning, colour is secondary. */
const STYLE: Record<Priority, { icon: LucideIcon; className: string; name: string }> = {
  P1: { icon: ChevronsUp, className: 'bg-destructive-soft text-destructive-soft-foreground', name: 'สูงสุด' },
  P2: { icon: ChevronUp, className: 'bg-warning-soft text-warning-soft-foreground', name: 'สูง' },
  P3: { icon: Minus, className: 'bg-info-soft text-info-soft-foreground', name: 'ปานกลาง' },
  P4: { icon: ChevronDown, className: 'bg-muted text-muted-foreground', name: 'ต่ำ' },
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const { icon: Icon, className: tone, name } = STYLE[priority];
  return (
    <span
      title={`Priority ${priority} (${name})`}
      className={cn(
        'inline-flex items-center gap-[var(--space-1)] rounded-[var(--badge-radius)] px-[var(--badge-padding-x)] py-0.5 text-[length:var(--fs-sm)] font-semibold whitespace-nowrap tabular-nums',
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" strokeWidth={2.25} className="size-[var(--icon-sm)] shrink-0" />
      {priority}
      <span className="sr-only"> ({name})</span>
    </span>
  );
}
