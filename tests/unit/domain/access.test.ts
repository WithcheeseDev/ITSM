import { describe, expect, it } from 'vitest';
import { availableActions, can, canViewCall, filterVisibleCalls } from '@/domain/access';
import { seedDataset } from '@/data/storage';
import type { User } from '@/domain/types';

const db = seedDataset();
const perms = db.rolePermissions;
const user = (id: string) => db.users.find((u) => u.id === id)!;
const call = (id: string) => db.supportCalls.find((c) => c.id === id)!;
const visibleIds = (id: string) => filterVisibleCalls(user(id), db.supportCalls, db.approvals, perms).map((c) => c.id);
const ctx = { approvals: db.approvals, rolePermissions: perms, now: Date.parse('2026-11-11T09:00:00+07:00'), history: db.callHistory };

describe('can (default-deny)', () => {
  it('matches rolePermissions exactly', () => {
    for (const u of db.users)
      for (const p of new Set(Object.values(perms).flat()))
        expect(can(u, p, perms)).toBe(perms[u.role].includes(p));
  });

  it('unknown permission, unknown role, no user → false', () => {
    expect(can(user('usr_008'), 'call:delete_everything', perms)).toBe(false);
    expect(can({ role: 'hacker' } as unknown as User, 'call:create', perms)).toBe(false);
    expect(can({ role: 'toString' } as unknown as User, 'call:create', perms)).toBe(false);
    expect(can(null, 'call:create', perms)).toBe(false);
  });
});

describe('visibility (US-004)', () => {
  it('requestor sees only calls they requested or opened', () => {
    expect(visibleIds('usr_001').sort()).toEqual(['call_001', 'call_002', 'call_005', 'call_007', 'call_009']);
    expect(visibleIds('usr_003')).toEqual(['call_002']);
  });

  it('approver additionally sees calls with an approval assigned to them', () => {
    // usr_004 is Department approver of call_005/006/007/008 and opened call_006/008
    expect(visibleIds('usr_004').sort()).toEqual(['call_005', 'call_006', 'call_007', 'call_008']);
    expect(visibleIds('usr_005').sort()).toEqual(['call_006', 'call_008']);
  });

  it('agent sees own + calls of their groups only', () => {
    expect(visibleIds('usr_006').sort()).toEqual(['call_001', 'call_004', 'call_005', 'call_006', 'call_007', 'call_009']);
    expect(visibleIds('usr_007').sort()).toEqual(['call_002', 'call_008']);
  });

  it('admin sees everything', () => {
    expect(visibleIds('usr_008')).toHaveLength(db.supportCalls.length);
  });

  it('canViewCall denies another requestor', () => {
    expect(canViewCall(user('usr_002'), call('call_001'), db.approvals, perms)).toBe(false);
    expect(canViewCall(null, call('call_001'), db.approvals, perms)).toBe(false);
  });
});

describe('availableActions', () => {
  it('agent of the queue group: assign + change status + comment', () => {
    expect(availableActions(user('usr_006'), call('call_001'), ctx)).toEqual(['assign', 'changeStatus', 'comment']);
  });

  it('agent outside the group gets nothing', () => {
    expect(availableActions(user('usr_007'), call('call_001'), ctx)).toEqual([]);
  });

  it('requestor on own open call: comment + cancel, no status change', () => {
    expect(availableActions(user('usr_001'), call('call_001'), ctx)).toEqual(['comment', 'cancel']);
  });

  it('requestor on own Resolved call within 7 days: reopen, not cancel', () => {
    const a = availableActions(user('usr_001'), call('call_009'), ctx);
    expect(a).toContain('reopen');
    expect(a).not.toContain('cancel');
    expect(availableActions(user('usr_001'), call('call_009'), { ...ctx, now: Date.parse('2026-11-20T00:00:00+07:00') })).not.toContain('reopen');
  });

  it('closed call: no comment / cancel / assign', () => {
    expect(availableActions(user('usr_002'), call('call_004'), ctx)).toEqual([]);
    expect(availableActions(user('usr_006'), call('call_004'), ctx)).toEqual([]);
  });

  it('admin is read-only; stranger gets nothing', () => {
    expect(availableActions(user('usr_008'), call('call_002'), ctx)).toEqual([]);
    expect(availableActions(user('usr_002'), call('call_001'), ctx)).toEqual([]);
  });
});
