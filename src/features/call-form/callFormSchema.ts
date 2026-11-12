/**
 * C7 form schema — Requirements §4.5. Field rules come from `validateCallInput` (the same checks
 * `createCall` runs before saving), so the form and the service always show the same Thai messages.
 */
import { z } from 'zod';
import { attachmentSchema } from '@/data/schemas';
import { levelsFor, PRIORITY_ERROR } from '@/domain/priority';
import { URGENCY_RFC, IMPACT_RFC, type Impact, type Template, type Urgency } from '@/domain/types';
import { validateCallInput, type CallInput } from '@/features/calls/callService';

export const RFC_ONLY = 'ระดับนี้ใช้กับ RFC เท่านั้น';

/** Form values: text inputs hold '' for empty; `toCallInput` turns them into the service shape. */
const baseSchema = z.object({
  requestedFor: z.enum(['myself', 'somebody_else']),
  requestorId: z.string(),
  phone: z.string(),
  email: z.string(),
  customerReference: z.string(),
  templateId: z.string(),
  serviceDefinitionId: z.string(),
  urgency: z.string(),
  impact: z.string(),
  serviceId: z.string(),
  productId: z.string(),
  itemId: z.string(),
  serialNumber: z.string(),
  summary: z.string(),
  notes: z.string(),
  attachments: z.array(attachmentSchema),
});

export type CallFormValues = z.infer<typeof baseSchema>;

const orNull = (v: string) => (v.trim() ? v.trim() : null);

export function toCallInput(v: CallFormValues): CallInput {
  return {
    ...v,
    requestorId: orNull(v.requestorId),
    phone: orNull(v.phone),
    email: orNull(v.email),
    customerReference: orNull(v.customerReference),
    serviceDefinitionId: orNull(v.serviceDefinitionId),
    urgency: v.urgency as Urgency,
    impact: v.impact as Impact,
    serviceId: orNull(v.serviceId),
    productId: orNull(v.productId),
    itemId: orNull(v.itemId),
    serialNumber: orNull(v.serialNumber),
  };
}

const RFC_LEVELS: readonly string[] = [...URGENCY_RFC, ...IMPACT_RFC];

/** Urgency/Impact must belong to the set of the template's call type (BR-02, US-016). */
function levelError(level: string, allowed: readonly string[]): string | null {
  if (allowed.includes(level)) return null;
  return RFC_LEVELS.includes(level) ? RFC_ONLY : PRIORITY_ERROR;
}

export function makeCallFormSchema(templates: readonly Template[]) {
  return baseSchema.superRefine((v, ctx) => {
    for (const [path, message] of Object.entries(validateCallInput(toCallInput(v)))) {
      ctx.addIssue({ code: 'custom', path: [path], message });
    }
    const template = templates.find((t) => t.id === v.templateId);
    if (!template) return;
    const levels = levelsFor(template.callType);
    const urgency = levelError(v.urgency, levels.urgency);
    if (urgency) ctx.addIssue({ code: 'custom', path: ['urgency'], message: urgency });
    const impact = levelError(v.impact, levels.impact);
    if (impact) ctx.addIssue({ code: 'custom', path: ['impact'], message: impact });
  });
}
