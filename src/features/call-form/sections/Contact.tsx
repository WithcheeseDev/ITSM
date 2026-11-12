import { useFormContext } from 'react-hook-form';
import type { User } from '@/domain/types';
import { Input } from '@/shared/ui/input';
import type { CallFormValues } from '../callFormSchema';
import { Field, FormSection } from '../Field';

/** US-015 — Contact Information. Name follows Requested for; email/phone are filled from the requestor. */
export function Contact({ me, users }: { me: User; users: readonly User[] }) {
  const { register, watch, formState } = useFormContext<CallFormValues>();
  const [requestedFor, requestorId] = watch(['requestedFor', 'requestorId']);
  const requestor = requestedFor === 'myself' ? me : users.find((u) => u.id === requestorId);
  const { errors } = formState;

  return (
    <FormSection id="sec-contact" title="Contact Information">
      <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
        <Field id="requestorName" label="Requestor's Name">
          {(p) => <Input {...p} readOnly value={requestor?.name ?? ''} placeholder="ยังไม่ได้เลือกผู้แจ้ง" className="bg-muted" />}
        </Field>
        <Field id="phone" label="Phone number" error={errors.phone?.message} hint="ตัวเลข 9–10 หลัก">
          {(p) => <Input {...p} {...register('phone')} inputMode="tel" autoComplete="tel" />}
        </Field>
        <Field id="email" label="E-mail" error={errors.email?.message}>
          {(p) => <Input {...p} {...register('email')} type="email" autoComplete="email" />}
        </Field>
        <Field id="customerReference" label="Your reference no.">
          {(p) => <Input {...p} {...register('customerReference')} />}
        </Field>
      </div>
    </FormSection>
  );
}
