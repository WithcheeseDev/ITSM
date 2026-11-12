import type { ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** primary action, e.g. a Button */
  action?: ReactNode;
}

/** Empty state = icon + message + main action (design-system §6). */
export function EmptyState({ title, description, icon: Icon = Inbox, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-10)] text-center">
      <Icon aria-hidden="true" strokeWidth={1.5} className="size-[var(--icon-xl)] text-muted-foreground" />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-[28rem] text-[length:var(--fs-sm)] text-muted-foreground">{description}</p>}
      {action && <div className="mt-[var(--space-2)]">{action}</div>}
    </div>
  );
}
