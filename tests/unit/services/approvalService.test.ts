import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataStore } from '@/data/repositories';
import type { User } from '@/domain/types';
import {
  APPROVAL_MESSAGES, createApprovals, decide, DEFAULT_APPROVAL_CRITERIA, listMyApprovals,
} from '@/features/approvals/approvalService';
import { buildDataset, buildStore, FIXED_NOW } from '../../fixtures';

const NOW = Date.parse(FIXED_NOW);
let store: DataStore;
const user = (id: string): User => store.getDataset().users.find((x) => x.id === id)!;
const call = (id: string) => store.getDataset().supportCalls.find((c) => c.id === id)!;
const approval = (id: string) => store.getDataset().approvals.find((a) => a.id === id)!;
const historyOf = (id: string) => store.getDataset().callHistory.filter((h) => h.callId === id);

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  store = buildStore();
});

describe('createApprovals', () => {
  const d = buildDataset();
  const u = (id: string) => d.users.find((x) => x.id === id)!;

  it('walks the manager chain, one pending approval per step', () => {
    const r = createApprovals('c1', { requiresApproval: ['Department approval', 'Head approval'] }, u('usr_001'), d.users, d.rolePermissions);
    expect(r.ok && r.data.map((a) => [a.approvalType, a.approverId, a.decision, a.done])).toEqual([
      ['Department approval', 'usr_004', 'pending', false],
      ['Head approval', 'usr_005', 'pending', false],
    ]);
  });

  it('returns no approvals for a template without steps', () => {
    expect(createApprovals('c1', { requiresApproval: [] }, u('usr_003'), d.users, d.rolePermissions)).toEqual({ ok: true, data: [] });
  });

  it('fails with APPROVER_NOT_FOUND when a manager is missing or cannot approve', () => {
    expect(createApprovals('c1', { requiresApproval: ['Department approval'] }, u('usr_003'), d.users, d.rolePermissions)).toMatchObject({
      ok: false, error: { code: 'APPROVER_NOT_FOUND' },
    });
    expect(createApprovals('c1', { requiresApproval: ['Department approval'] }, { managerId: 'usr_006' }, d.users, d.rolePermissions)).toMatchObject({
      ok: false, error: { code: 'APPROVER_NOT_FOUND' },
    });
  });
});

describe('listMyApprovals', () => {
  it('default criteria: my pending approvals, deciding allowed only when earlier steps are approved', () => {
    const rows = listMyApprovals(user('usr_004'), DEFAULT_APPROVAL_CRITERIA, store);
    expect(rows.map((r) => [r.approval.id, r.canDecide])).toEqual([['apv_001', true]]);
    const head = listMyApprovals(user('usr_005'), DEFAULT_APPROVAL_CRITERIA, store);
    expect(head.map((r) => [r.approval.id, r.canDecide, r.waitingForPrevious])).toEqual([['apv_003', true, false]]);
  });

  it('Done = All lists decided steps too, read-only', () => {
    const rows = listMyApprovals(user('usr_004'), { ...DEFAULT_APPROVAL_CRITERIA, done: 'all' }, store);
    expect(rows.map((r) => r.approval.id).sort()).toEqual(['apv_001', 'apv_002', 'apv_004', 'apv_005']);
    expect(rows.filter((r) => r.approval.done).every((r) => !r.canDecide)).toBe(true);
  });

  it('filters by call number, summary and approval type', () => {
    const all = { ...DEFAULT_APPROVAL_CRITERIA, done: 'all' as const };
    expect(listMyApprovals(user('usr_004'), { ...all, callNumber: '100008' }, store).map((r) => r.approval.id)).toEqual(['apv_005']);
    expect(listMyApprovals(user('usr_005'), { ...all, approvalType: 'Department approval' }, store)).toEqual([]);
    expect(listMyApprovals(user('usr_004'), { ...all, summary: 'NOTEBOOK' }, store).map((r) => r.call.id)).toEqual(['call_005']);
  });

  it('shows "waiting" when an earlier step is still pending', () => {
    const created = createApprovals('call_005', { requiresApproval: ['Department approval', 'Head approval'] }, user('usr_001'), store.getDataset().users, store.getDataset().rolePermissions);
    if (!created.ok) throw new Error('setup');
    const d = store.getDataset();
    store.commit({ approvals: [...d.approvals.filter((a) => a.callId !== 'call_005'), ...created.data] });
    const row = listMyApprovals(user('usr_005'), DEFAULT_APPROVAL_CRITERIA, store).find((r) => r.call.id === 'call_005');
    expect(row).toMatchObject({ canDecide: false, waitingForPrevious: true });
  });

  it('returns nothing for roles without approval:view_assigned', () => {
    expect(listMyApprovals(user('usr_001'), DEFAULT_APPROVAL_CRITERIA, store)).toEqual([]);
    expect(listMyApprovals(null, DEFAULT_APPROVAL_CRITERIA, store)).toEqual([]);
  });
});

describe('decide', () => {
  it('last Service Request step approved → Request In-Progress and the SLA starts', () => {
    const commit = vi.spyOn(store, 'commit');
    const r = decide(user('usr_005'), 'apv_003', 'approved', null, NOW, store);
    expect(r).toMatchObject({ ok: true, data: { done: true, decision: 'approved', decidedAt: FIXED_NOW } });
    expect(commit).toHaveBeenCalledTimes(1);
    expect(call('call_006')).toMatchObject({ status: 'Request In-Progress', dueDate: '2026-11-14T09:00:00+07:00' });
    expect(historyOf('call_006').slice(-2).map((h) => [h.action, h.fromStatus, h.toStatus])).toEqual([
      ['approved', 'Department Accepted', 'Head Approved'],
      ['status_changed', 'Head Approved', 'Request In-Progress'],
    ]);
  });

  it('single-step request approved → Department Accepted then Request In-Progress', () => {
    decide(user('usr_004'), 'apv_001', 'approved', null, NOW, store);
    expect(call('call_005').status).toBe('Request In-Progress');
  });

  it('rejection needs a reason; with one it declines and closes the call', () => {
    expect(decide(user('usr_004'), 'apv_001', 'rejected', '  ', NOW, store)).toMatchObject({
      ok: false, error: { code: 'VALIDATION', fieldErrors: { comment: APPROVAL_MESSAGES.reason } },
    });
    expect(approval('apv_001').done).toBe(false);
    decide(user('usr_004'), 'apv_001', 'rejected', 'ไม่จำเป็น', NOW, store);
    expect(call('call_005')).toMatchObject({ status: 'Department Declined', closeDate: FIXED_NOW });
    expect(historyOf('call_005').at(-1)).toMatchObject({ action: 'rejected', comment: 'ไม่จำเป็น' });
  });

  it('a later step waits for the earlier one', () => {
    const created = createApprovals('call_005', { requiresApproval: ['Department approval', 'Head approval'] }, user('usr_001'), store.getDataset().users, store.getDataset().rolePermissions);
    if (!created.ok) throw new Error('setup');
    const d = store.getDataset();
    store.commit({ approvals: [...d.approvals.filter((a) => a.callId !== 'call_005'), ...created.data] });
    const head = created.data[1]!;
    expect(decide(user('usr_005'), head.id, 'approved', null, NOW, store)).toMatchObject({
      ok: false, error: { code: 'FORBIDDEN', fieldErrors: { approval: APPROVAL_MESSAGES.waiting } },
    });
  });

  it('RFC: last step rejected → Cancelled', () => {
    const d = buildDataset();
    store = buildStore({
      ...d,
      supportCalls: d.supportCalls.map((c) => (c.id === 'call_008' ? { ...c, status: 'Request For Change' as const } : c)),
      approvals: d.approvals.map((a) => (a.id === 'apv_006' ? { ...a, done: false, decision: 'pending' as const, decidedAt: null, comment: null } : a)),
    });
    decide(user('usr_005'), 'apv_006', 'rejected', 'ยังไม่พร้อม', NOW, store);
    expect(call('call_008').status).toBe('Cancelled');
  });

  it('RFC: last step approved → Ready for CAB', () => {
    const d = buildDataset();
    store = buildStore({
      ...d,
      supportCalls: d.supportCalls.map((c) => (c.id === 'call_008' ? { ...c, status: 'Request For Change' as const } : c)),
      approvals: d.approvals.map((a) => (a.id === 'apv_006' ? { ...a, done: false, decision: 'pending' as const, decidedAt: null, comment: null } : a)),
    });
    decide(user('usr_005'), 'apv_006', 'approved', null, NOW, store);
    expect(call('call_008').status).toBe('Ready for CAB');
  });

  it('NOT_FOUND for someone else\'s approval, FORBIDDEN once decided', () => {
    expect(decide(user('usr_005'), 'apv_001', 'approved', null, NOW, store)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    expect(decide(user('usr_004'), 'apv_002', 'approved', null, NOW, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(decide(null, 'apv_001', 'approved', null, NOW, store)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });
});
