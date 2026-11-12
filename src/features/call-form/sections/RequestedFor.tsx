import { Controller, useFormContext } from 'react-hook-form';
import type { User } from '@/domain/types';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { CallFormValues } from '../callFormSchema';
import { Field, FormSection } from '../Field';

/** US-014 — Myself / Somebody else. Picking a person fills Contact from that user (US-015). */
export function RequestedFor({ me, users }: { me: User; users: readonly User[] }) {
  const { control, watch, setValue, formState } = useFormContext<CallFormValues>();
  const requestedFor = watch('requestedFor');
  const others = users.filter((u) => u.id !== me.id);

  const fillContact = (user: User | undefined) => {
    setValue('email', user?.email ?? '', { shouldDirty: true, shouldValidate: true });
    setValue('phone', user?.phone ?? '', { shouldDirty: true, shouldValidate: true });
  };

  return (
    <FormSection id="sec-requested-for" title="Requested for">
      <Controller
        control={control}
        name="requestedFor"
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            aria-label="แจ้งเรื่องให้"
            className="flex flex-wrap gap-x-[var(--space-6)] gap-y-0"
            onValueChange={(v) => {
              const next = v as CallFormValues['requestedFor'];
              field.onChange(next);
              if (next === 'myself') {
                setValue('requestorId', '', { shouldValidate: formState.isSubmitted });
                fillContact(me);
              }
            }}
          >
            {(['myself', 'somebody_else'] as const).map((v) => (
              <Label key={v} className="flex min-h-[var(--tap-target)] cursor-pointer items-center gap-[var(--space-2)] font-normal">
                <RadioGroupItem value={v} />
                {v === 'myself' ? 'Myself (แจ้งให้ตัวเอง)' : 'Somebody else (แจ้งแทน)'}
              </Label>
            ))}
          </RadioGroup>
        )}
      />

      {requestedFor === 'somebody_else' && (
        <div className="mt-[var(--space-3)] grid grid-cols-1 md:grid-cols-2">
          <Controller
            control={control}
            name="requestorId"
            render={({ field, fieldState }) => (
              <Field id="requestorId" label="ผู้ถูกแจ้งแทน" error={fieldState.error?.message}>
                {(p) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(id) => {
                      field.onChange(id);
                      fillContact(others.find((u) => u.id === id));
                    }}
                  >
                    <SelectTrigger {...p} onBlur={field.onBlur} className="w-full">
                      <SelectValue placeholder="เลือกชื่อ" />
                    </SelectTrigger>
                    <SelectContent>
                      {others.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                          {u.department ? ` · ${u.department}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>
            )}
          />
        </div>
      )}
    </FormSection>
  );
}
