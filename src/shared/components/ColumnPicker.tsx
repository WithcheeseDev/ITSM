import { useId } from 'react';
import { Columns3 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { CALL_COLUMNS, DEFAULT_COLUMN_IDS, REQUIRED_COLUMN_ID } from './callColumns';

interface Props {
  value: readonly string[];
  onChange: (ids: string[]) => void;
}

/** "เลือกคอลัมน์" button for the card header (US-011). Number is always shown. */
export function ColumnPicker({ value, onChange }: Props) {
  const baseId = useId();
  const toggle = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Columns3 aria-hidden="true" className="size-[var(--icon-sm)]" />
          เลือกคอลัมน์
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-[var(--space-3)]">
        <p className="px-[var(--space-1)] pb-[var(--space-2)] text-[length:var(--fs-sm)] font-medium">คอลัมน์ที่แสดง</p>
        <ul className="max-h-[22rem] overflow-y-auto">
          {CALL_COLUMNS.map((c) => {
            const id = `${baseId}-${c.id}`;
            const required = c.id === REQUIRED_COLUMN_ID;
            return (
              <li key={c.id} className="flex min-h-[var(--tap-target)] items-center gap-[var(--space-3)] px-[var(--space-1)]">
                <Checkbox id={id} checked={required || value.includes(c.id)} disabled={required} onCheckedChange={(v) => toggle(c.id, v === true)} />
                <Label htmlFor={id} className="flex-1 font-normal">
                  {c.label}
                </Label>
                {required && <span className="text-[length:var(--fs-xs)] text-muted-foreground">แสดงเสมอ</span>}
              </li>
            );
          })}
        </ul>
        <div className="mt-[var(--space-2)] border-t pt-[var(--space-2)]">
          <Button variant="ghost" className="w-full" onClick={() => onChange([...DEFAULT_COLUMN_IDS])}>
            คืนค่าเริ่มต้น
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
