import { Controller, useFormContext } from 'react-hook-form';
import { MAX_SUMMARY } from '@/features/calls/callService';
import { Input } from '@/shared/ui/input';
import type { CallFormValues } from '../callFormSchema';
import { Field, FormSection } from '../Field';
import { RichTextEditor } from '../RichTextEditor';

/** US-018 — Summary (1–200 chars) + Notes (rich text, required after stripping tags). */
export function Details() {
  const { register, watch, control, formState } = useFormContext<CallFormValues>();
  const summaryLength = watch('summary').trim().length;

  return (
    <FormSection id="sec-details" title="Details">
      <div className="grid grid-cols-1 gap-[var(--space-4)]">
        <Field id="summary" label="Summary" error={formState.errors.summary?.message} hint={`${summaryLength}/${MAX_SUMMARY} ตัวอักษร`}>
          {(p) => <Input {...p} {...register('summary')} />}
        </Field>
        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field id="notes" label="Notes" error={fieldState.error?.message}>
              {(p) => <RichTextEditor value={field.value} onChange={field.onChange} onBlur={field.onBlur} label="Notes" control={p} />}
            </Field>
          )}
        />
      </div>
    </FormSection>
  );
}
