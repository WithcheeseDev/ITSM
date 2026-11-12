/**
 * Access control (C3) — default-deny: a permission not listed for the role is false.
 * Decisions use permissions (rolePermissions), not role names, so data drives behaviour.
 * Used by route guards AND services before any write (US-003).
 */
import { canReopenAt, cancelStatus, isClosed, nextStatuses } from './stateMachine';
import type { Approval, CallHistory, Role, SupportCall, User } from './types';

export type RolePermissions = Partial<Record<Role | string, readonly string[]>>;

export function can(user: Pick<User, 'role'> | null | undefined, permission: string, rolePermissions: RolePermissions): boolean {
  if (!user) return false;
  const list = Object.hasOwn(rolePermissions, user.role) ? rolePermissions[user.role] : undefined;
  return Array.isArray(list) && list.includes(permission);
}

const isOwn = (user: Pick<User, 'id'>, call: Pick<SupportCall, 'requestorId' | 'openedByUserId'>): boolean =>
  call.requestorId === user.id || call.openedByUserId === user.id;

export function canViewCall(
  user: Pick<User, 'id' | 'role' | 'groupIds'> | null | undefined,
  call: Pick<SupportCall, 'id' | 'requestorId' | 'openedByUserId' | 'groupId'>,
  approvals: readonly Pick<Approval, 'callId' | 'approverId'>[],
  rolePermissions: RolePermissions,
): boolean {
  if (!user) return false;
  if (can(user, 'call:view_all', rolePermissions)) return true;
  if (can(user, 'call:view_own', rolePermissions) && isOwn(user, call)) return true;
  if (can(user, 'call:view_group', rolePermissions) && user.groupIds.includes(call.groupId)) return true;
  return can(user, 'approval:view_assigned', rolePermissions) && approvals.some((a) => a.callId === call.id && a.approverId === user.id);
}

export function filterVisibleCalls<T extends Pick<SupportCall, 'id' | 'requestorId' | 'openedByUserId' | 'groupId'>>(
  user: Pick<User, 'id' | 'role' | 'groupIds'> | null | undefined,
  calls: readonly T[],
  approvals: readonly Pick<Approval, 'callId' | 'approverId'>[],
  rolePermissions: RolePermissions,
): T[] {
  return calls.filter((c) => canViewCall(user, c, approvals, rolePermissions));
}

export type CallAction = 'assign' | 'changeStatus' | 'comment' | 'cancel' | 'reopen';

export interface ActionContext {
  approvals: readonly Pick<Approval, 'callId' | 'approverId'>[];
  rolePermissions: RolePermissions;
  now: Date | number;
  history?: readonly CallHistory[];
  closedStatuses?: readonly string[];
}

/** Actions the user may take on a call right now (ActionBar + service checks). Admin gets none (read-only). */
export function availableActions(user: User | null | undefined, call: SupportCall, ctx: ActionContext): CallAction[] {
  if (!user || !canViewCall(user, call, ctx.approvals, ctx.rolePermissions)) return [];
  const p = (perm: string) => can(user, perm, ctx.rolePermissions);
  const own = isOwn(user, call);
  const inGroup = user.groupIds.includes(call.groupId);
  const closed = isClosed(call.status, ctx.closedStatuses);
  const actions: CallAction[] = [];

  if (p('call:assign') && inGroup && !closed) actions.push('assign');
  if (p('call:change_status') && inGroup && nextStatuses(call.callType, call.status).length > 0) actions.push('changeStatus');
  if (!closed && ((own && p('call:comment_own')) || (inGroup && p('call:comment_any')))) actions.push('comment');

  const cancelTo = cancelStatus(call.callType);
  if (own && p('call:cancel_own') && !closed && call.status !== 'Resolved' && cancelTo && nextStatuses(call.callType, call.status).includes(cancelTo)) {
    actions.push('cancel');
  }
  if (own && p('call:reopen_own') && canReopenAt(call, ctx.now, ctx.history)) actions.push('reopen');
  return actions;
}
