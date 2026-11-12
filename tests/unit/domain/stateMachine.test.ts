import { describe, expect, it } from 'vitest';
import {
  assertTransition, canReopenAt, cancelStatus, initialStatus, isClosed, nextStatuses, shouldAutoClose, TRANSITIONS,
} from '@/domain/stateMachine';
import { CALL_TYPES, STATUS_BY_CALL_TYPE, type CallHistory, type Status } from '@/domain/types';
import { seedDataset } from '@/data/storage';

const db = seedDataset();

describe('transition table', () => {
  it('every from/to status belongs to its call type set', () => {
    for (const ct of CALL_TYPES) {
      const set = STATUS_BY_CALL_TYPE[ct] as readonly string[];
      for (const [from, tos] of Object.entries(TRANSITIONS[ct])) {
        expect(set).toContain(from);
        for (const to of tos as readonly string[]) expect(set).toContain(to);
      }
    }
  });

  it('Incident follows §4.4', () => {
    expect(nextStatuses('Incident', 'New')).toEqual(['Assigned', 'Cancelled']);
    expect(nextStatuses('Incident', 'In Process')).toContain('Pending');
    expect(nextStatuses('Incident', 'Pending')).toContain('In Process');
    expect(nextStatuses('Incident', 'Resolved')).toEqual(['Closed', 'Re-Opened']);
    expect(nextStatuses('Incident', 'Re-Opened')).toContain('In Process');
    expect(nextStatuses('Incident', 'Closed')).toEqual([]);
    expect(nextStatuses('Incident', 'Resolved')).not.toContain('Cancelled');
  });

  it('assertTransition accepts allowed and rejects others with INVALID_TRANSITION', () => {
    expect(assertTransition('Incident', 'Assigned', 'In Process')).toEqual({ ok: true, data: undefined });
    const bad = assertTransition('Incident', 'New', 'Resolved');
    expect(!bad.ok && bad.error).toEqual({ code: 'INVALID_TRANSITION', message: 'ไม่สามารถเปลี่ยนสถานะนี้ได้' });
    expect(assertTransition('Service Requests', 'Request Submitted', 'Head Approved').ok).toBe(false);
    expect(assertTransition('Change (RFC)', 'Implementation', 'Completed').ok).toBe(true);
    expect(assertTransition('Change (RFC)', 'Implementation', 'Cancelled').ok).toBe(false);
  });

  it('assertTransition ⟺ nextStatuses for every pair', () => {
    for (const ct of CALL_TYPES)
      for (const a of STATUS_BY_CALL_TYPE[ct] as readonly Status[])
        for (const b of STATUS_BY_CALL_TYPE[ct] as readonly Status[])
          expect(assertTransition(ct, a, b).ok).toBe(nextStatuses(ct, a).includes(b));
  });

  it('closed statuses have no exits except the §4.4 "→ Closed" steps', () => {
    for (const ct of CALL_TYPES)
      for (const s of STATUS_BY_CALL_TYPE[ct] as readonly Status[])
        if (isClosed(s)) expect(nextStatuses(ct, s).every((t) => t === 'Closed')).toBe(true);
  });
});

describe('initialStatus', () => {
  const tpl = (id: string) => db.templates.find((t) => t.id === id)!;
  it('per call type and template approval', () => {
    expect(initialStatus('Incident', tpl('tpl_001'))).toBe('New');
    expect(initialStatus('Service Requests', tpl('tpl_004'))).toBe('Waiting For Approve');
    expect(initialStatus('Service Requests', { requiresApproval: [] })).toBe('Request Submitted');
    expect(initialStatus('Change (RFC)', tpl('tpl_006'))).toBe('Request For Change');
  });
});

describe('cancel / reopen / auto-close', () => {
  const resolved = { id: 'call_009', status: 'Resolved' as const, resolvedAt: '2026-11-08T11:00:00+07:00' };
  const at = (iso: string) => Date.parse(iso);

  it('cancel target per call type', () => {
    expect(cancelStatus('Incident')).toBe('Cancelled');
    expect(cancelStatus('Service Requests')).toBe('Request Cancelled');
    expect(cancelStatus('Problem')).toBeNull();
  });

  it('re-open within 7 days (inclusive), not after', () => {
    expect(canReopenAt(resolved, at('2026-11-15T11:00:00+07:00'))).toBe(true);
    expect(canReopenAt(resolved, at('2026-11-15T11:00:01+07:00'))).toBe(false);
    expect(canReopenAt({ ...resolved, status: 'Closed' }, at('2026-11-09T00:00:00+07:00'))).toBe(false);
  });

  it('auto close strictly after 7 days', () => {
    expect(shouldAutoClose(resolved, [], at('2026-11-15T11:00:00+07:00'))).toBe(false);
    expect(shouldAutoClose(resolved, [], at('2026-11-15T11:00:00+07:00') + 1)).toBe(true);
    expect(shouldAutoClose({ ...resolved, status: 'In Process' }, [], at('2026-12-31T00:00:00+07:00'))).toBe(false);
  });

  it('falls back to history when resolvedAt is missing', () => {
    const history: CallHistory[] = [
      { id: 'h', callId: 'x', at: '2026-11-01T00:00:00+07:00', byUserId: 'u', action: 'status_changed', fromStatus: 'In Process', toStatus: 'Resolved', comment: null },
    ];
    expect(shouldAutoClose({ id: 'x', status: 'Resolved', resolvedAt: null }, history, at('2026-11-09T00:00:00+07:00'))).toBe(true);
    expect(shouldAutoClose({ id: 'x', status: 'Resolved', resolvedAt: null }, [], at('2027-01-01T00:00:00+07:00'))).toBe(false);
  });
});
