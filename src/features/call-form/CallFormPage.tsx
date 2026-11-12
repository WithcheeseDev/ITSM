import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { CircleX } from 'lucide-react';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { dataStore } from '@/data/repositories';
import { can } from '@/domain/access';
import type { Dataset, User } from '@/domain/types';
import { useSession } from '@/features/auth/sessionStore';
import { createCall } from '@/features/calls/callService';
import { logger } from '@/shared/logger';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import type { AiDraft } from '@/features/ai-assistant/assistant';
import { makeCallFormSchema, toCallInput, type CallFormValues } from './callFormSchema';
import { Attachments } from './sections/Attachments';
import { CiInfo } from './sections/CiInfo';
import { Contact } from './sections/Contact';
import { Details } from './sections/Details';
import { PriorityTemplate } from './sections/PriorityTemplate';
import { RequestedFor } from './sections/RequestedFor';

/**
 * Initial values: requestor = current user (US-015); `?service=` (catalog, US-013) or an AI draft (US-032)
 * fills the template. The draft only pre-fills — the user still reviews and presses OK.
 */
function initialValues(me: User, d: Dataset, serviceId: string | null, draft: AiDraft | null): CallFormValues {
  if (draft) serviceId = draft.serviceDefinitionId;
  const service = serviceId ? d.serviceDefinitions.find((s) => s.id === serviceId) : undefined;
  if (serviceId && !service) logger.warn('callForm.unknownService', { serviceId });
  const template = service ? d.templates.find((t) => t.id === service.templateId) : undefined;
  return {
    requestedFor: 'myself',
    requestorId: '',
    phone: me.phone ?? '',
    email: me.email,
    customerReference: '',
    templateId: template?.id ?? '',
    serviceDefinitionId: template && service ? service.id : '',
    urgency: (template && draft?.urgency) || template?.defaultUrgency || '',
    impact: (template && draft?.impact) || template?.defaultImpact || '',
    serviceId: '',
    productId: '',
    itemId: '',
    serialNumber: '',
    summary: draft?.summary ?? '',
    notes: draft?.notes ?? '',
    attachments: [],
  };
}

/** C7 Add Support Call — US-013 to US-019, US-032. Remounted per navigation so a new ?service= / AI draft re-fills it. */
export function CallFormPage() {
  const location = useLocation();
  return <CallForm key={location.key} />;
}

function CallForm() {
  const location = useLocation();
  const aiDraft = (location.state as { aiDraft?: AiDraft } | null)?.aiDraft ?? null;
  const { user } = useSession();
  const [params] = useSearchParams();
  const serviceParam = params.get('service');
  const d = dataStore.getDataset();
  const schema = useMemo(() => makeCallFormSchema(d.templates), [d.templates]);

  // RequirePermission guarantees a session; the cast only narrows the type
  const me = user as User;
  const form = useForm<CallFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    shouldFocusError: false,
    defaultValues: initialValues(me, d, serviceParam, aiDraft),
  });
  const service = d.serviceDefinitions.find((s) => s.id === form.watch('serviceDefinitionId'));
  const navigate = useNavigate();
  // read during render: RHF only tracks formState fields that the render subscribed to
  const { isDirty, isSubmitting } = form.formState;
  const [confirmLeave, setConfirmLeave] = useState(false);
  // Focus the first invalid control in DOM order after the errors have rendered (C7 error handling)
  const [focusRequest, setFocusRequest] = useState(0);
  const focusFirstError = () => setFocusRequest((n) => n + 1);
  useEffect(() => {
    if (focusRequest) document.querySelector<HTMLElement>('#call-form [aria-invalid="true"]')?.focus();
  }, [focusRequest]);

  const leave = () => {
    // opened directly (no in-app history) → go home instead of leaving the app
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) void navigate(-1);
    else void navigate('/my-space');
  };

  const onSubmit = form.handleSubmit((values) => {
    const result = createCall(me, toCallInput(values));
    if (!result.ok) {
      const fieldErrors = Object.entries(result.error.fieldErrors ?? {});
      for (const [name, message] of fieldErrors) form.setError(name as keyof CallFormValues, { message });
      if (fieldErrors.length > 0) focusFirstError();
      else toast.error(result.error.message, { id: 'call-create-error' });
      return;
    }
    toast.success(`สร้าง Support Call #${result.data.number} แล้ว`);
    void navigate(`/calls/${result.data.id}`);
  }, focusFirstError);

  return (
    <div className="mx-auto w-full max-w-[var(--form-max)]">
      <h1 className="text-[length:var(--fs-xl)] md:text-[length:var(--fs-2xl)]">แจ้งเรื่องใหม่</h1>
      <p className="mt-[var(--space-1)] text-muted-foreground">
        {service ? `บริการ: ${service.name}` : 'กรอกข้อมูลแล้วกด OK เพื่อส่งเรื่อง'}
        {aiDraft && ' · กรอกจาก AI Assistant ตรวจข้อมูลก่อนกด OK'}
      </p>
      <FormProvider {...form}>
        <form id="call-form" noValidate className="mt-[var(--section-gap)] flex flex-col gap-[var(--section-gap)]" onSubmit={onSubmit}>
          {can(me, 'call:create_on_behalf', d.rolePermissions) && <RequestedFor me={me} users={d.users} />}
          <Contact me={me} users={d.users} />
          <PriorityTemplate dataset={d} />
          <CiInfo dataset={d} />
          <Details />
          <Attachments />
          {/* sticky on mobile so OK stays reachable on a long form (design-system §7) */}
          <div className="sticky bottom-0 -mx-[var(--gutter)] flex justify-end gap-[var(--space-3)] bg-card/95 px-[var(--gutter)] pt-[var(--space-3)] pb-[max(var(--space-3),env(safe-area-inset-bottom))] shadow-[var(--shadow-md)] md:static md:mx-0 md:bg-transparent md:p-0 md:shadow-none">
            <Button type="button" variant="outline" onClick={() => (isDirty ? setConfirmLeave(true) : leave())}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              OK
            </Button>
          </div>
        </form>
      </FormProvider>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ทิ้งข้อมูลที่กรอกไว้?</AlertDialogTitle>
            <AlertDialogDescription>ข้อมูลในฟอร์มนี้ยังไม่ได้บันทึก ถ้าออกตอนนี้ข้อมูลจะหายไป</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>กลับไปกรอกต่อ</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={leave}>
              <CircleX aria-hidden="true" />
              ทิ้งข้อมูล
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
