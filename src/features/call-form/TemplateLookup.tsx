import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import type { Template } from '@/domain/types';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import type { FieldControlProps } from './Field';

/** US-016 — searchable template lookup with a clear button. */
export function TemplateLookup({
  templates, value, onChange, onBlur, control,
}: {
  templates: readonly Template[];
  value: string;
  onChange: (id: string) => void;
  onBlur: () => void;
  control: FieldControlProps;
}) {
  const [open, setOpen] = useState(false);
  const selected = templates.find((t) => t.id === value);

  return (
    <div className="flex gap-[var(--space-2)]">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) onBlur();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            {...control}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-0 flex-1 justify-between font-normal aria-invalid:border-destructive"
          >
            <span className={cn('truncate', !selected && 'text-placeholder')}>{selected?.name ?? 'ค้นหา Template'}</span>
            <ChevronsUpDown aria-hidden="true" className="size-[var(--icon-sm)] text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[18rem] p-0">
          <Command>
            <CommandInput placeholder="พิมพ์ชื่อ Template" />
            <CommandList>
              <CommandEmpty>ไม่พบ Template</CommandEmpty>
              <CommandGroup>
                {templates.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`${t.name} ${t.callType}`}
                    className="min-h-[var(--tap-target)]"
                    onSelect={() => {
                      onChange(t.id);
                      setOpen(false);
                    }}
                  >
                    <Check aria-hidden="true" className={cn('size-[var(--icon-sm)]', t.id === value ? 'opacity-100' : 'opacity-0')} />
                    <span className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-[length:var(--fs-sm)] text-muted-foreground">{t.callType}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected && (
        <Button type="button" variant="outline" size="icon" aria-label="ล้าง Template" onClick={() => onChange('')}>
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
