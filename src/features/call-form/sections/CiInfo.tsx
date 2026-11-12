import { Controller, useFormContext } from 'react-hook-form';
import { X } from 'lucide-react';
import type { Dataset } from '@/domain/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { CallFormValues } from '../callFormSchema';
import { Field, FormSection } from '../Field';

type Option = { id: string; label: string };

/** Select with a clear button — Radix Select cannot be emptied once picked. */
function ClearableSelect({
  name, label, options, placeholder, disabled, onChange,
}: {
  name: 'serviceId' | 'productId' | 'itemId';
  label: string;
  options: Option[];
  placeholder: string;
  disabled?: boolean;
  onChange?: (id: string) => void;
}) {
  const { control } = useFormContext<CallFormValues>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const set = (id: string) => {
          field.onChange(id);
          onChange?.(id);
        };
        return (
          <Field id={name} label={label}>
            {(p) => (
              <div className="flex gap-[var(--space-2)]">
                <Select value={field.value || ''} onValueChange={set} disabled={disabled}>
                  <SelectTrigger {...p} onBlur={field.onBlur} className="min-w-0 flex-1">
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.value && (
                  <Button type="button" variant="outline" size="icon" aria-label={`ล้าง ${label}`} onClick={() => set('')}>
                    <X aria-hidden="true" />
                  </Button>
                )}
              </div>
            )}
          </Field>
        );
      }}
    />
  );
}

/** US-017 — Service, Product (→ Version read-only), Item lookup, Serial number. */
export function CiInfo({ dataset }: { dataset: Dataset }) {
  const { register, watch, setValue } = useFormContext<CallFormValues>();
  const productId = watch('productId');
  const product = dataset.products.find((p) => p.id === productId);
  const items = dataset.items.filter((i) => i.productId === productId);

  return (
    <FormSection id="sec-ci" title="CI Information">
      <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
        <ClearableSelect
          name="serviceId"
          label="Service"
          placeholder="เลือก Service"
          options={dataset.services.map((s) => ({ id: s.id, label: s.name }))}
        />
        <ClearableSelect
          name="productId"
          label="Product"
          placeholder="เลือก Product"
          options={dataset.products.map((p) => ({ id: p.id, label: p.serialNumber ? `${p.name} (${p.serialNumber})` : p.name }))}
          // an item belongs to one product — picking or clearing the product drops the old item
          onChange={() => setValue('itemId', '', { shouldDirty: true })}
        />
        <Field id="version" label="Version">
          {(p) => <Input {...p} readOnly value={product?.version ?? ''} placeholder="เติมจาก Product" className="bg-muted" />}
        </Field>
        <ClearableSelect
          name="itemId"
          label="Item"
          disabled={items.length === 0}
          placeholder={!product ? 'เลือก Product ก่อน' : items.length === 0 ? 'Product นี้ไม่มี Item' : 'เลือก Item'}
          options={items.map((i) => ({ id: i.id, label: i.name }))}
        />
        <Field id="serialNumber" label="Serial number">
          {(p) => <Input {...p} {...register('serialNumber')} />}
        </Field>
      </div>
    </FormSection>
  );
}
