/**
 * C8 Call Service — the only writer of supportCalls / callHistory / approvals.
 * Every use case: check permission (C3) → rules (C4) → build changes → ONE dataStore.commit (Business Rule 5).
 * Actions (assign / status / comment / cancel / re-open) check `availableActions` (C3) — the same rule the ActionBar uses.
 */
import { dataStore, type DataStore } from '@/data/repositories';
import { availableActions, can, canViewCall, filterVisibleCalls, type CallAction } from '@/domain/access';
import { nextNumber } from '@/domain/numbering';
import { calcPriority } from '@/domain/priority';
import { calcDueDate, formatIso } from '@/domain/sla';
import { assertTransition, cancelStatus, initialStatus, isClosed, shouldAutoClose } from '@/domain/stateMachine';
import {
  fail, ok, type Attachment, type CallHistory, type ClosureCategory, type HistoryAction, type Impact, type Result, type Status,
  type SupportCall, type Urgency, type User,
} from '@/domain/types';
import { createApprovals } from '@/features/approvals/approvalService';
import { logger } from '@/shared/logger';
import { htmlToText, sanitizeHtml } from '@/shared/sanitize';

export interface CallInput {
  requestedFor: 'myself' | 'somebody_else';
  /** required when requestedFor = somebody_else; ignored (= actor) for myself */
  requestorId: string | null;
  phone: string | null;
  email: string | null;
  customerReference: string | null;
  templateId: string;
  /** the catalog service the user picked — decides the category (SLA rule); optional for the direct form */
  serviceDefinitionId?: string | null;
  urgency: Urgency;
  impact: Impact;
  serviceId: string | null;
  productId: string | null;
  itemId: string | null;
  serialNumber: string | null;
  summary: string;
  notes: string;
  attachments: Attachment[];
}

/** Validation messages — Requirements §4.5 */
export const MESSAGES = {
  requestor: 'กรุณาเลือกผู้แจ้ง',
  summary: 'กรุณากรอกหัวข้อเรื่อง',
  summaryLength: 'หัวข้อเรื่องยาวได้ไม่เกิน 200 ตัวอักษร',
  notes: 'กรุณาระบุรายละเอียด',
  email: 'รูปแบบอีเมลไม่ถูกต้อง',
  phone: 'เบอร์โทรไม่ถูกต้อง',
  template: 'กรุณาเลือก Template',
  attachmentSize: 'ไฟล์ใหญ่เกินกำหนด',
  attachmentCount: 'แนบได้สูงสุด 5 ไฟล์',
  comment: 'กรุณาพิมพ์ความเห็น',
  closureCategory: 'กรุณาเลือก Closure Category',
  assignee: 'กรุณาเลือกผู้รับผิดชอบในกลุ่ม',
} as const;

export const MAX_SUMMARY = 200;
export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{9,10}$/;

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
const blankToNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

/** Field checks shared with the form (task 2.8) so both show the same Thai messages. */
export function validateCallInput(input: CallInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.requestedFor === 'somebody_else' && !input.requestorId) errors.requestorId = MESSAGES.requestor;
  const summary = input.summary.trim();
  if (!summary) errors.summary = MESSAGES.summary;
  else if (summary.length > MAX_SUMMARY) errors.summary = MESSAGES.summaryLength;
  if (!htmlToText(input.notes)) errors.notes = MESSAGES.notes;
  const email = blankToNull(input.email);
  if (email && !EMAIL_RE.test(email)) errors.email = MESSAGES.email;
  const phone = blankToNull(input.phone);
  if (phone && !PHONE_RE.test(phone)) errors.phone = MESSAGES.phone;
  if (!input.templateId) errors.templateId = MESSAGES.template;
  if (input.attachments.length > MAX_ATTACHMENTS) errors.attachments = MESSAGES.attachmentCount;
  else if (input.attachments.some((a) => a.size > MAX_ATTACHMENT_BYTES)) errors.attachments = MESSAGES.attachmentSize;
  return errors;
}

/** US-014, US-018 — create a call with history `created` and its approval chain in one commit. */
export function createCall(actor: User, input: CallInput, now: number = Date.now(), store: DataStore = dataStore): Result<SupportCall> {
  const d = store.getDataset();
  const perms = d.rolePermissions;
  if (!can(actor, 'call:create', perms)) return fail('FORBIDDEN');

  const onBehalf = input.requestedFor === 'somebody_else';
  if (onBehalf && !can(actor, 'call:create_on_behalf', perms)) return fail('FORBIDDEN');

  const errors = validateCallInput(input);
  const requestorId = onBehalf ? input.requestorId : actor.id;
  const requestor = requestorId ? d.users.find((u) => u.id === requestorId) : undefined;
  if (!requestor && !errors.requestorId) errors.requestorId = MESSAGES.requestor;

  const template = d.templates.find((t) => t.id === input.templateId);
  if (!template && !errors.templateId) errors.templateId = MESSAGES.template;

  if (!requestor || !template || Object.keys(errors).length > 0) {
    logger.info('callForm.validationFailed', { fieldNames: Object.keys(errors) });
    return fail('VALIDATION', errors);
  }

  const priority = calcPriority(template.callType, input.urgency, input.impact, d);
  if (!priority.ok) return priority as Result<never>;

  const queue = d.queues.find((q) => q.id === template.defaultQueueId);
  if (!queue) {
    logger.error('callService.create.failed', { code: 'VALIDATION', templateId: template.id, reason: 'queue' });
    return fail('VALIDATION', { templateId: MESSAGES.template });
  }

  const number = nextNumber(d.runningNumber.supportCall, d.supportCalls.map((c) => c.number));
  if (!number.ok) return number as Result<never>;

  const callId = newId('call');
  const approvals = createApprovals(callId, template, requestor, d.users, perms);
  if (!approvals.ok) {
    logger.warn('callService.create.failed', { code: approvals.error.code, templateId: template.id });
    return approvals as Result<never>;
  }

  // Category of the call → SLA starts after final approval when the category says so (US-006)
  const definition =
    d.serviceDefinitions.find((s) => s.id === input.serviceDefinitionId) ?? d.serviceDefinitions.find((s) => s.templateId === template.id);
  const category = definition ? d.serviceCategories.find((c) => c.id === definition.categoryId) : undefined;
  const waitsForApproval = approvals.data.length > 0 && category?.slaStartsAfterApproval === true;

  const openDate = formatIso(now);
  const product = input.productId ? d.products.find((p) => p.id === input.productId) : undefined;
  const status = initialStatus(template.callType, template);

  const call: SupportCall = {
    id: callId,
    number: number.data.number,
    callType: template.callType,
    classification: template.classification,
    parentCategory: template.parentCategory,
    category: template.category,
    subCategory: template.subCategory,
    templateId: template.id,
    requestorId: requestor.id,
    openedByUserId: actor.id,
    phone: blankToNull(input.phone),
    email: blankToNull(input.email),
    customerReference: blankToNull(input.customerReference),
    urgency: input.urgency,
    impact: input.impact,
    priority: priority.data,
    serviceId: input.serviceId ?? definition?.serviceId ?? null,
    productId: product?.id ?? null,
    itemId: input.itemId,
    serialNumber: blankToNull(input.serialNumber),
    version: product?.version ?? null, // US-017: version comes from the product, read-only
    summary: input.summary.trim(),
    notes: sanitizeHtml(input.notes), // C13: sanitize on save too
    status,
    queueId: queue.id,
    groupId: queue.groupId,
    assignedToId: null,
    organizationId: requestor.organizationId,
    locationId: requestor.locationId,
    openDate,
    dueDate: waitsForApproval ? null : calcDueDate(openDate, priority.data, d.slaHoursByPriority),
    closeDate: null,
    closureCategory: null,
    itsrReference: null,
    vvip: requestor.vvip,
    surveyResult: null,
    feedbackCategory: null,
    readByUserIds: [actor.id],
    attachments: input.attachments.map(({ name, size, type }) => ({ name, size, type })),
    resolvedAt: null,
  };

  const history: CallHistory = {
    id: newId('his'),
    callId,
    at: openDate,
    byUserId: actor.id,
    action: 'created',
    fromStatus: null,
    toStatus: status,
    comment: null,
  };

  const saved = store.commit({
    supportCalls: [...d.supportCalls, call],
    callHistory: [...d.callHistory, history],
    approvals: [...d.approvals, ...approvals.data],
    runningNumber: { ...d.runningNumber, supportCall: number.data.runningNumber },
  });
  if (!saved.ok) {
    logger.warn('callService.create.failed', { code: saved.error.code });
    return saved as Result<never>;
  }
  logger.info('callService.create.ok', { callId, action: 'create' });
  return ok(call);
}

/** US-004 — calls the actor may see, newest open date first. */
export function listVisibleCalls(actor: User | null, store: DataStore = dataStore): SupportCall[] {
  const d = store.getDataset();
  return filterVisibleCalls(actor, d.supportCalls, d.approvals, d.rolePermissions).sort(
    (a, b) => Date.parse(b.openDate) - Date.parse(a.openDate),
  );
}

/** US-023 / US-004 — NOT_FOUND for both "missing" and "not allowed" so nothing leaks. */
export function getCall(actor: User | null, callId: string, store: DataStore = dataStore): Result<SupportCall> {
  const d = store.getDataset();
  const call = store.repository('supportCalls').findById(callId);
  if (!call || !canViewCall(actor, call, d.approvals, d.rolePermissions)) return fail('NOT_FOUND');
  return ok(call);
}

// ---------------------------------------------------------------- actions (task 4.1)

/** Loads the call and checks the actor may take `action` now: invisible → NOT_FOUND, visible but not allowed → FORBIDDEN. */
function _authorize(actor: User | null, callId: string, action: CallAction, now: number, store: DataStore): Result<SupportCall> {
  const d = store.getDataset();
  const found = getCall(actor, callId, store);
  if (!found.ok) return found;
  const allowed = availableActions(actor, found.data, {
    approvals: d.approvals,
    rolePermissions: d.rolePermissions,
    now,
    history: d.callHistory,
    closedStatuses: d.enums.closedStatuses,
  });
  if (!allowed.includes(action)) {
    logger.warn('callService.action.forbidden', { callId, action });
    return fail('FORBIDDEN');
  }
  return found;
}

/** BR-3 / BR-5 — one call update + its history entry in a single commit. */
function _commitChange(
  store: DataStore,
  call: SupportCall,
  patch: Partial<SupportCall>,
  entry: { actor: User; action: HistoryAction; at: string; toStatus?: Status; comment?: string | null; attachments?: Attachment[] },
): Result<SupportCall> {
  const d = store.getDataset();
  const updated: SupportCall = { ...call, ...patch };
  const history: CallHistory = {
    id: newId('his'),
    callId: call.id,
    at: entry.at,
    byUserId: entry.actor.id,
    action: entry.action,
    fromStatus: call.status,
    toStatus: entry.toStatus ?? call.status,
    comment: entry.comment ?? null,
    ...(entry.attachments && entry.attachments.length > 0 ? { attachments: entry.attachments } : {}),
  };
  const saved = store.commit({
    supportCalls: d.supportCalls.map((c) => (c.id === call.id ? updated : c)),
    callHistory: [...d.callHistory, history],
  });
  if (!saved.ok) {
    logger.warn('callService.action.failed', { callId: call.id, action: entry.action, code: saved.error.code });
    return saved as Result<never>;
  }
  logger.info('callService.action.ok', { callId: call.id, action: entry.action });
  return ok(updated);
}

/** Status fields that follow a move to `to` (BR-3): resolvedAt on Resolved, closeDate on a closed status. */
function _statusPatch(to: Status, at: string, closedStatuses: readonly string[]): Partial<SupportCall> {
  return {
    status: to,
    resolvedAt: to === 'Resolved' ? at : null,
    closeDate: isClosed(to, closedStatuses) ? at : null,
  };
}

/** US-026 — assign to a member of the call's group; New → Assigned. */
export function assignCall(actor: User | null, callId: string, assigneeId: string, now: number = Date.now(), store: DataStore = dataStore): Result<SupportCall> {
  const found = _authorize(actor, callId, 'assign', now, store);
  if (!found.ok) return found;
  const call = found.data;
  const d = store.getDataset();
  const assignee = d.users.find((u) => u.id === assigneeId && u.groupIds.includes(call.groupId));
  if (!assignee) return fail('VALIDATION', { assigneeId: MESSAGES.assignee });

  const at = formatIso(now);
  const toAssigned = call.status === 'New' && assertTransition(call.callType, call.status, 'Assigned').ok;
  return _commitChange(
    store,
    call,
    { assignedToId: assignee.id, ...(toAssigned ? _statusPatch('Assigned', at, d.enums.closedStatuses) : {}) },
    { actor: actor as User, action: 'assigned', at, toStatus: toAssigned ? 'Assigned' : call.status, comment: `มอบหมายให้ ${assignee.name}` },
  );
}

/** US-026, US-027 — move along the state machine; Resolved requires a closure category. */
export function changeStatus(
  actor: User | null,
  callId: string,
  to: Status,
  opts: { closureCategory?: ClosureCategory | null; comment?: string | null } = {},
  now: number = Date.now(),
  store: DataStore = dataStore,
): Result<SupportCall> {
  const found = _authorize(actor, callId, 'changeStatus', now, store);
  if (!found.ok) return found;
  const call = found.data;
  const transition = assertTransition(call.callType, call.status, to);
  if (!transition.ok) return transition as Result<never>;

  const d = store.getDataset();
  const closure = opts.closureCategory ?? null;
  if (to === 'Resolved' && (!closure || !d.enums.closureCategories.includes(closure))) {
    return fail('VALIDATION', { closureCategory: MESSAGES.closureCategory });
  }
  const at = formatIso(now);
  return _commitChange(
    store,
    call,
    { ..._statusPatch(to, at, d.enums.closedStatuses), ...(to === 'Resolved' ? { closureCategory: closure } : {}) },
    { actor: actor as User, action: 'status_changed', at, toStatus: to, comment: blankToNull(opts.comment) },
  );
}

/** US-025 — comment (+ attachment metadata) on the timeline. */
export function addComment(
  actor: User | null,
  callId: string,
  text: string,
  attachments: Attachment[] = [],
  now: number = Date.now(),
  store: DataStore = dataStore,
): Result<SupportCall> {
  const found = _authorize(actor, callId, 'comment', now, store);
  if (!found.ok) return found;
  const comment = text.trim();
  if (!comment) return fail('VALIDATION', { comment: MESSAGES.comment });
  if (attachments.length > MAX_ATTACHMENTS) return fail('VALIDATION', { attachments: MESSAGES.attachmentCount });
  if (attachments.some((a) => a.size > MAX_ATTACHMENT_BYTES)) return fail('VALIDATION', { attachments: MESSAGES.attachmentSize });

  return _commitChange(store, found.data, {}, {
    actor: actor as User,
    action: 'commented',
    at: formatIso(now),
    comment,
    attachments: attachments.map(({ name, size, type }) => ({ name, size, type })),
  });
}

/** US-028 — requestor cancels a call that is not Resolved / closed yet. */
export function cancelCall(actor: User | null, callId: string, now: number = Date.now(), store: DataStore = dataStore): Result<SupportCall> {
  const found = _authorize(actor, callId, 'cancel', now, store);
  if (!found.ok) return found;
  const call = found.data;
  const to = cancelStatus(call.callType);
  if (!to) return fail('INVALID_TRANSITION');
  const transition = assertTransition(call.callType, call.status, to);
  if (!transition.ok) return transition as Result<never>;

  const at = formatIso(now);
  return _commitChange(store, call, _statusPatch(to, at, store.getDataset().enums.closedStatuses), {
    actor: actor as User,
    action: 'cancelled',
    at,
    toStatus: to,
  });
}

/** US-028 — requestor re-opens a call Resolved at most 7 days ago. */
export function reopenCall(actor: User | null, callId: string, now: number = Date.now(), store: DataStore = dataStore): Result<SupportCall> {
  const found = _authorize(actor, callId, 'reopen', now, store);
  if (!found.ok) return found;
  const call = found.data;
  const transition = assertTransition(call.callType, call.status, 'Re-Opened');
  if (!transition.ok) return transition as Result<never>;

  const at = formatIso(now);
  return _commitChange(
    store,
    call,
    { ..._statusPatch('Re-Opened', at, store.getDataset().enums.closedStatuses), closureCategory: null },
    { actor: actor as User, action: 'reopened', at, toStatus: 'Re-Opened' },
  );
}

/** US-028 / BR-06 — Resolved for more than 7 days → Closed (byUserId = system). Returns the number closed. */
export function runAutoClose(now: number = Date.now(), store: DataStore = dataStore): Result<number> {
  const d = store.getDataset();
  const due = d.supportCalls.filter((c) => shouldAutoClose(c, d.callHistory, now));
  if (due.length === 0) return ok(0);

  const at = formatIso(now);
  const ids = new Set(due.map((c) => c.id));
  const saved = store.commit({
    supportCalls: d.supportCalls.map((c) => (ids.has(c.id) ? { ...c, status: 'Closed', closeDate: at } : c)),
    callHistory: [
      ...d.callHistory,
      ...due.map<CallHistory>((c) => ({
        id: newId('his'),
        callId: c.id,
        at,
        byUserId: 'system',
        action: 'auto_closed',
        fromStatus: 'Resolved',
        toStatus: 'Closed',
        comment: null,
      })),
    ],
  });
  if (!saved.ok) return saved as Result<never>;
  logger.info('callService.autoClose.ok', { action: 'auto_close', count: due.length });
  return ok(due.length);
}
