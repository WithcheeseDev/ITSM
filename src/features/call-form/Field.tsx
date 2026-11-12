import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Label } from '@/shared/ui/label';

export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

/** Label + control + error under the field, linked by aria-describedby (C7 error handling). */
export function Field({
  id, label, error, hint, children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: (p: FieldControlProps) => ReactNode;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && (
        <p id={`${id}-hint`} className="text-[length:var(--fs-sm)] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-[var(--space-1)] text-[length:var(--fs-sm)] text-destructive">
          <CircleAlert aria-hidden="true" className="size-[var(--icon-sm)] shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Section card used by every form section (design-system §7 Add Support Call). */
export function FormSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-[var(--card-radius)] bg-card p-[var(--card-padding)] shadow-[var(--card-shadow)]"
    >
      <h2 id={id} className="mb-[var(--space-4)] text-[length:var(--fs-lg)]">
        {title}
      </h2>
      {children}
    </section>
  );
}
