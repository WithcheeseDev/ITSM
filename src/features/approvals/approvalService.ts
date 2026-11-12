/**
 * C14 Approval Service — approval chain for a new call, the approver's list, and decisions (US-030, US-031).
 * `decide` writes approval + call status + history in ONE commit (BR-5).
 */
import { dataStore, type DataStore } from '@/data/repositories';
import { can, canViewCall, type RolePermissions } from '@/domain/access';
import { calcDueDate, formatIso } from '@/domain/sla';
import { assertTransition, cancelStatus, isClosed } from '@/domain/stateMachine';
import {
  APPROVAL_TYPES, fail, ok, type Approval, type ApprovalType, type CallHistory, type HistoryAction, type Result,
  type Status, type SupportCall, type Template, type User,
} from '@/domain/types';
import { logger } from '@/shared/logger';

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

/**
 * One pending approval per step in template.requiresApproval [ASM]:
 * first step → requestor.managerId, each next step → managerId of the previous approver.
 * Missing manager, or a manager who cannot decide approvals → APPROVER_NOT_FOUND (call is not saved).
 */
export function createApprovals(
  callId: string,
  template: Pick<Template, 'requiresApproval'>,
  requestor: Pick<User, 'managerId'>,
  users: readonly User[],
  rolePermissions: RolePermissions,
): Result<Approval[]> {
  const byId = new Map(users.map((u) => [u.id, u]));
  const approvals: Approval[] = [];
  let managerId = requestor.managerId;

  for (const approvalType of template.requiresApproval) {
    const approver = managerId ? byId.get(managerId) : undefined;
    if (!approver || !can(approver, 'approval:decide_assigned', rolePermissions)) return fail('APPROVER_NOT_FOUND');
    approvals.push({
      id: newId('apv'),
      callId,
      approvalType,
      approverId: approver.id,
      done: false,
      decision: 'pending',
      comment: null,
      decidedAt: null,
    });
    managerId = approver.managerId;
  }
  return ok(approvals);
}

// ---------------------------------------------------------------- list + decide (task 4.4)

export const APPROVAL_MESSAGES = {
  reason: 'กรุณาระบุเหตุผล',
  waiting: 'รอผลขั้นก่อนหน้า',
} as const;

export type TriState = 'all' | 'yes' | 'no';

export interface ApprovalCriteria {
  callNumber: string;
  summary: string;
  approvalType: ApprovalType | '';
  done: TriState;
  rfcClosed: TriState;
  /** true = assigned to me only · false = also approvals of calls I can see (read-only) [ASM] */
  myApprovals: boolean;
}

/** US-030 default: My Approvals + Done = No. */
export const DEFAULT_APPROVAL_CRITERIA: ApprovalCriteria = {
  callNumber: '',
  summary: '',
  approvalType: '',
  done: 'no',
  rfcClosed: 'all',
  myApprovals: true,
};

export interface ApprovalRow {
  approval: Approval;
  call: SupportCall;
  /** actor may decide this step now */
  canDecide: boolean;
  /** pending, assigned to the actor, but an earlier step is not approved yet */
  waitingForPrevious: boolean;
}

const stepIndex = (t: ApprovalType) => APPROVAL_TYPES.indexOf(t);

/** Steps of the same call that come before `a` in the chain. */
const earlierSteps = (a: Approval, all: readonly Approval[]) =>
  all.filter((x) => x.callId === a.callId && stepIndex(x.approvalType) < stepIndex(a.approvalType));

const matchTri = (state: TriState, value: boolean) => state === 'all' || (state === 'yes') === value;
const contains = (value: string, needle: string) => !needle.trim() || value.toLowerCase().includes(needle.trim().toLowerCase());

export function listMyApprovals(actor: User | null, criteria: ApprovalCriteria, store: DataStore = dataStore): ApprovalRow[] {
  const d = store.getDataset();
  if (!actor || !can(actor, 'approval:view_assigned', d.rolePermissions)) return [];
  const calls = new Map(d.supportCalls.map((c) => [c.id, c]));
  const mayDecide = can(actor, 'approval:decide_assigned', d.rolePermissions);

  const rows: ApprovalRow[] = [];
  for (const a of d.approvals) {
    const call = calls.get(a.callId);
    if (!call) continue;
    const mine = a.approverId === actor.id;
    if (criteria.myApprovals ? !mine : !mine && !canViewCall(actor, call, d.approvals, d.rolePermissions)) continue;
    const rfcClosed = call.callType === 'Change (RFC)' && isClosed(call.status, d.enums.closedStatuses);
    if (
      !contains(call.number, criteria.callNumber) ||
      !contains(call.summary, criteria.summary) ||
      (criteria.approvalType && a.approvalType !== criteria.approvalType) ||
      !matchTri(criteria.done, a.done) ||
      (criteria.rfcClosed !== 'all' && call.callType === 'Change (RFC)' && !matchTri(criteria.rfcClosed, rfcClosed)) ||
      (criteria.rfcClosed === 'yes' && call.callType !== 'Change (RFC)')
    ) continue;
    const waitingForPrevious = earlierSteps(a, d.approvals).some((x) => x.decision !== 'approved');
    const open = !a.done && !isClosed(call.status, d.enums.closedStatuses);
    rows.push({ approval: a, call, canDecide: mine && mayDecide && open && !waitingForPrevious, waitingForPrevious: mine && open && waitingForPrevious });
  }
  // pending first, then newest call
  return rows.sort((x, y) => Number(x.approval.done) - Number(y.approval.done) || Date.parse(y.call.openDate) - Date.parse(x.call.openDate));
}

type Step = { to: Status; action: HistoryAction };

/** Status changes for a decision (api-spec "ผลของ decide" tables). Service Requests and RFC differ [ASM]. */
function _stepsFor(call: SupportCall, a: Approval, decision: 'approved' | 'rejected', isLast: boolean): Step[] {
  if (call.callType === 'Service Requests') {
    const head = a.approvalType === 'Head approval';
    if (decision === 'rejected') return [{ to: head ? 'Head Rejected' : 'Department Declined', action: 'rejected' }];
    const accepted: Step = { to: head ? 'Head Approved' : 'Department Accepted', action: 'approved' };
    return isLast ? [accepted, { to: 'Request In-Progress', action: 'status_changed' }] : [accepted];
  }
  if (decision === 'rejected') {
    const to = cancelStatus(call.callType);
    return to ? [{ to, action: 'rejected' }] : [{ to: call.status, action: 'rejected' }];
  }
  if (isLast && call.callType === 'Change (RFC)') return [{ to: 'Ready for CAB', action: 'approved' }];
  return [{ to: call.status, action: 'approved' }];
}

/** US-031 — decide one step. Rejection needs a reason; a step waits until every earlier step is approved. */
export function decide(
  actor: User | null,
  approvalId: string,
  decision: 'approved' | 'rejected',
  comment: string | null = null,
  now: number = Date.now(),
  store: DataStore = dataStore,
): Result<Approval> {
  const d = store.getDataset();
  const a = d.approvals.find((x) => x.id === approvalId);
  const call = a ? d.supportCalls.find((c) => c.id === a.callId) : undefined;
  if (!a || !call || !actor || a.approverId !== actor.id) return fail('NOT_FOUND');
  if (!can(actor, 'approval:decide_assigned', d.rolePermissions) || a.done || isClosed(call.status, d.enums.closedStatuses)) {
    return fail('FORBIDDEN');
  }
  if (earlierSteps(a, d.approvals).some((x) => x.decision !== 'approved')) {
    return fail('FORBIDDEN', { approval: APPROVAL_MESSAGES.waiting });
  }
  const reason = comment?.trim() || null;
  if (decision === 'rejected' && !reason) return fail('VALIDATION', { comment: APPROVAL_MESSAGES.reason });

  const isLast = !d.approvals.some((x) => x.callId === a.callId && stepIndex(x.approvalType) > stepIndex(a.approvalType));
  const steps = _stepsFor(call, a, decision, isLast);
  let from = call.status;
  for (const step of steps) {
    if (step.to !== from) {
      const t = assertTransition(call.callType, from, step.to);
      if (!t.ok) {
        logger.warn('approval.decide.failed', { approvalId, code: 'INVALID_TRANSITION' });
        return t as Result<never>;
      }
    }
    from = step.to;
  }

  const at = formatIso(now);
  const finalStatus = from;
  const decided: Approval = { ...a, done: true, decision, comment: reason, decidedAt: at };
  const history: CallHistory[] = [];
  let prev = call.status;
  for (const [i, step] of steps.entries()) {
    history.push({
      id: newId('his'),
      callId: call.id,
      at,
      byUserId: actor.id,
      action: step.action,
      fromStatus: prev,
      toStatus: step.to,
      comment: i === 0 ? reason : null,
    });
    prev = step.to;
  }
  // US-006: a call created with dueDate = null (category slaStartsAfterApproval) starts its SLA at the final approval
  const startSla = decision === 'approved' && isLast && call.dueDate === null;
  const updated: SupportCall = {
    ...call,
    status: finalStatus,
    closeDate: isClosed(finalStatus, d.enums.closedStatuses) ? at : call.closeDate,
    dueDate: startSla ? calcDueDate(at, call.priority, d.slaHoursByPriority) : call.dueDate,
  };

  const saved = store.commit({
    approvals: d.approvals.map((x) => (x.id === a.id ? decided : x)),
    supportCalls: d.supportCalls.map((c) => (c.id === call.id ? updated : c)),
    callHistory: [...d.callHistory, ...history],
  });
  if (!saved.ok) {
    logger.warn('approval.decide.failed', { approvalId, code: saved.error.code });
    return saved as Result<never>;
  }
  logger.info('approval.decide.ok', { approvalId, callId: call.id, action: decision });
  return ok(decided);
}
