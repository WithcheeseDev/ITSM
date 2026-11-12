import { Controller, useFormContext } from 'react-hook-form';
import type { Dataset, Impact, Urgency } from '@/domain/types';
import { calcPriority, levelsFor } from '@/domain/priority';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { CallFormValues } from '../callFormSchema';
import { Field, FormSection } from '../Field';
import { TemplateLookup } from '../TemplateLookup';

function ReadOnly({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[length:var(--fs-sm)] text-muted-foreground">{label}</dt>
      <dd className="mt-[var(--space-1)]">{value || '—'}</dd>
    </div>
  );
}

/** US-016 — template fills call type / classification / category / queue / default levels; priority previews live. */
export function PriorityTemplate({ dataset }: { dataset: Dataset }) {
  const { control, watch, setValue, trigger, formState } = useFormContext<CallFormValues>();
  const [templateId, urgency, impact] = watch(['templateId', 'urgency', 'impact']);
  const template = dataset.templates.find((t) => t.id === templateId);
  const levels = levelsFor(template?.callType ?? 'Incident');
  const queue = template ? dataset.queues.find((q) => q.id === template.defaultQueueId) : undefined;
  const priority = template ? calcPriority(template.callType, urgency as Urgency, impact as Impact, dataset) : null;
  const category = template ? [template.parentCategory, template.category, template.subCategory].filter(Boolean).join(' > ') : '';

  const levelSelect = (name: 'urgency' | 'impact', label: string, options: readonly string[]) => (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field id={name} label={label} error={fieldState.error?.message}>
          {(p) => (
            <Select value={field.value || undefined} onValueChange={field.onChange} disabled={!template}>
              <SelectTrigger {...p} onBlur={field.onBlur} className="w-full">
                <SelectValue placeholder={template ? 'เลือกระดับ' : 'เลือก Template ก่อน'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>
      )}
    />
  );

  return (
    <FormSection id="sec-priority" title="Priority and Template">
      <div className="grid grid-cols-1 gap-[var(--space-4)]">
        <Controller
          control={control}
          name="templateId"
          render={({ field, fieldState }) => (
            <Field id="templateId" label="Template" error={fieldState.error?.message}>
              {(p) => (
                <TemplateLookup
                  templates={dataset.templates}
                  value={field.value}
                  onBlur={field.onBlur}
                  control={p}
                  onChange={(id) => {
                    field.onChange(id);
                    const t = dataset.templates.find((x) => x.id === id);
                    setValue('urgency', t?.defaultUrgency ?? '', { shouldDirty: true });
                    setValue('impact', t?.defaultImpact ?? '', { shouldDirty: true });
                    // a direct template pick no longer matches the catalog service it came from
                    setValue('serviceDefinitionId', '', { shouldDirty: true });
                    if (formState.isSubmitted) void trigger(['templateId', 'urgency', 'impact']);
                  }}
                />
              )}
            </Field>
          )}
        />

        {template && (
          <dl className="grid grid-cols-1 gap-[var(--space-3)] rounded-[var(--radius-md)] bg-surface-sunken p-[var(--space-4)] sm:grid-cols-2">
            <ReadOnly label="Call Type" value={template.callType} />
            <ReadOnly label="Classification" value={template.classification} />
            <ReadOnly label="Category" value={category} />
            <ReadOnly label="Queue" value={queue?.name} />
          </dl>
        )}

        <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-[1fr_1fr_auto] md:items-start">
          {levelSelect('urgency', 'Urgency', levels.urgency)}
          {levelSelect('impact', 'Impact', levels.impact)}
          <div className="flex flex-col gap-[var(--space-2)]">
            <span aria-hidden="true" className="text-[length:var(--fs-sm)] font-medium">
              Priority
            </span>
            <div role="status" className="flex min-h-[var(--input-height)] items-center">
              <span className="sr-only">Priority </span>
              {priority?.ok ? <PriorityBadge priority={priority.data} /> : <span className="text-muted-foreground">—</span>}
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
