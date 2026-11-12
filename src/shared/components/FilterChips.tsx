import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  /** accessible name of the group, e.g. "ประเภทเรื่อง" */
  label: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Single-select filter chips (design-system §6): selected = primary-soft + Check icon, not colour alone. */
export function FilterChips<T extends string>({ label, options, value, onChange }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-[var(--space-2)]">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex min-h-[var(--tap-target)] items-center gap-[var(--space-1)] rounded-[var(--radius-full)] border px-[var(--space-4)] text-[length:var(--fs-sm)] font-medium transition-colors duration-[var(--dur-fast)]',
              selected
                ? 'border-primary bg-primary-soft text-primary-soft-foreground'
                : 'border-input bg-card text-foreground hover:bg-muted',
            )}
          >
            {selected && <Check aria-hidden="true" className="size-[var(--icon-sm)]" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
