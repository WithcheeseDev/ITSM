/**
 * State machine per call type (Requirements §4.4 [ASM], D1-7) — constant table, no data dependency.
 * Gaps §4.4 does not spell out are marked [ASM] below.
 */
import { CLOSED_STATUSES, fail, ok, STATUS_BY_CALL_TYPE, type CallHistory, type CallType, type IsoDate, type Result, type Status, type SupportCall, type Template } from './types';

type Table = { [C in CallType]: Partial<Record<(typeof STATUS_BY_CALL_TYPE)[C][number], readonly (typeof STATUS_BY_CALL_TYPE)[C][number][]>> };

export const TRANSITIONS = {
  // New → Assigned → In Process ⇄ Pending → Resolved → Closed · Resolved → Re-Opened → In Process · any before Resolved → Cancelled
  Incident: {
    New: ['Assigned', 'Cancelled'],
    Assigned: ['In Process', 'Cancelled'],
    'In Process': ['Pending', 'Resolved', 'Cancelled'],
    Pending: ['In Process', 'Resolved', 'Cancelled'],
    Resolved: ['Closed', 'Re-Opened'],
    'Re-Opened': ['In Process', 'Cancelled'],
  },
  // Submitted → Waiting For Approve → Dept Accepted|Declined → Head Approved|Rejected → In-Progress → Completed → Closed
  'Service Requests': {
    'Request Submitted': ['Waiting For Approve', 'Request In-Progress', 'Request Cancelled'], // [ASM] no-approval template starts work directly
    'Waiting For Approve': ['Department Accepted', 'Department Declined', 'Request Cancelled'],
    'Department Accepted': ['Head Approved', 'Head Rejected', 'Request In-Progress', 'Request Cancelled'], // [ASM] → In-Progress when Department is the last step
    'Head Approved': ['Request In-Progress', 'Request Cancelled'],
    'Request In-Progress': ['Request Completed', 'Request Cancelled'],
    'Request Completed': ['Closed'],
  },
  // Draft → Request For Change → Under Review → Ready for CAB → Scheduled for Review → Implementation → Completed|Failed → Closed
  'Change (RFC)': {
    Draft: ['Request For Change', 'Cancelled'],
    'Request For Change': ['Under Review', 'Ready for CAB', 'Cancelled'], // [ASM] final approval → Ready for CAB (api-spec decide table, seed call_008)
    'Under Review': ['Ready for CAB', 'Cancelled'],
    'Ready for CAB': ['Scheduled for Review', 'Cancelled'], // [ASM] cancel allowed until Implementation
    'Scheduled for Review': ['Implementation', 'Cancelled'],
    Implementation: ['Completed', 'Failed'],
    Completed: ['Closed'],
    Failed: ['Closed'],
  },
  // New → Root Cause Identify → Known Error → Resolution Identify → Monitoring → Closed (Nice)
  Problem: {
    New: ['Root Cause Identify'],
    'Root Cause Identify': ['Known Error'],
    'Known Error': ['Resolution Identify'],
    'Resolution Identify': ['Monitoring'],
    Monitoring: ['Closed'],
  },
  // [ASM] not in §4.4 and no template creates ITSR — follows statusByCallType order
  'Request Fulfilment (ITSR)': {
    'Request Submitted': ['Request In-Progress'],
    'Request In-Progress': ['Delivered'],
    Delivered: ['Waiting for return', 'Request Completed'],
    'Waiting for return': ['Request Completed'],
    'Request Completed': ['Closed'],
  },
} as const satisfies Table;

export const AUTO_CLOSE_DAYS = 7;
const DAY = 86_400_000;

export function nextStatuses(callType: CallType, status: Status): readonly Status[] {
  const table = TRANSITIONS[callType] as Partial<Record<Status, readonly Status[]>>;
  return table[status] ?? [];
}

export function assertTransition(callType: CallType, from: Status, to: Status): Result<void> {
  return nextStatuses(callType, from).includes(to) ? ok(undefined) : fail('INVALID_TRANSITION');
}

export function initialStatus(callType: CallType, template: Pick<Template, 'requiresApproval'> | null): Status {
  switch (callType) {
    case 'Incident':
    case 'Problem':
      return 'New';
    case 'Service Requests':
      return template && template.requiresApproval.length > 0 ? 'Waiting For Approve' : 'Request Submitted';
    case 'Change (RFC)':
      return 'Request For Change';
    case 'Request Fulfilment (ITSR)':
      return 'Request Submitted';
  }
}

export const isClosed = (status: Status, closedStatuses: readonly string[] = CLOSED_STATUSES): boolean =>
  closedStatuses.includes(status);

/** Target of "ยกเลิกเรื่อง" for a call type, or null when the type has no cancel status. */
export function cancelStatus(callType: CallType): Status | null {
  if (callType === 'Service Requests') return 'Request Cancelled';
  return (STATUS_BY_CALL_TYPE[callType] as readonly Status[]).includes('Cancelled') ? 'Cancelled' : null;
}

function resolvedAtOf(call: Pick<SupportCall, 'id' | 'resolvedAt'>, history: readonly CallHistory[]): IsoDate | null {
  if (call.resolvedAt) return call.resolvedAt;
  const times = history.filter((h) => h.callId === call.id && h.toStatus === 'Resolved').map((h) => Date.parse(h.at));
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

/** Re-open allowed while Resolved for at most `windowDays` (US-028). */
export function canReopenAt(call: Pick<SupportCall, 'id' | 'status' | 'resolvedAt'>, now: Date | number, history: readonly CallHistory[] = [], windowDays = AUTO_CLOSE_DAYS): boolean {
  const at = resolvedAtOf(call, history);
  return call.status === 'Resolved' && at !== null && +now - Date.parse(at) <= windowDays * DAY;
}

/** Resolved for more than `windowDays` → auto close (BR-06). */
export function shouldAutoClose(call: Pick<SupportCall, 'id' | 'status' | 'resolvedAt'>, history: readonly CallHistory[], now: Date | number, windowDays = AUTO_CLOSE_DAYS): boolean {
  const at = resolvedAtOf(call, history);
  return call.status === 'Resolved' && at !== null && +now - Date.parse(at) > windowDays * DAY;
}
