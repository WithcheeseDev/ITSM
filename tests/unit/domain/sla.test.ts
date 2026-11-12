import { describe, expect, it } from 'vitest';
import { calcDueDate, formatIso, formatTimeLeft, timeLeft } from '@/domain/sla';
import { isClosed } from '@/domain/stateMachine';
import { seedDataset } from '@/data/storage';

const sla = seedDataset().slaHoursByPriority;
const now = Date.parse('2026-11-11T09:00:00+07:00');

describe('calcDueDate', () => {
  it('adds SLA hours from data, output in +07:00', () => {
    expect(calcDueDate('2026-11-10T09:15:00+07:00', 'P4', sla)).toBe('2026-11-13T09:15:00+07:00');
    expect(calcDueDate('2026-11-11T09:00:00+07:00', 'P1', sla)).toBe('2026-11-11T13:00:00+07:00');
  });

  it('crosses day, month and year boundaries (24×7)', () => {
    expect(calcDueDate('2026-11-11T22:00:00+07:00', 'P2', sla)).toBe('2026-11-12T06:00:00+07:00');
    expect(calcDueDate('2026-11-30T20:00:00+07:00', 'P1', sla)).toBe('2026-12-01T00:00:00+07:00');
    expect(calcDueDate('2026-12-31T23:30:00+07:00', 'P3', sla)).toBe('2027-01-01T23:30:00+07:00');
  });

  it('accepts UTC input and keeps the instant', () => {
    const due = calcDueDate('2026-11-11T02:00:00.000Z', 'P1', sla);
    expect(due).toBe('2026-11-11T13:00:00+07:00');
    expect(Date.parse(due) - Date.parse('2026-11-11T02:00:00Z')).toBe(4 * 3_600_000);
  });

  it('formatIso round-trips', () => {
    expect(Date.parse(formatIso(now))).toBe(now);
  });
});

describe('timeLeft', () => {
  const base = { now, status: 'Assigned' as const, awaitingApproval: false };

  it('formats "X days hh:mm"', () => {
    expect(formatTimeLeft((1 * 1440 + 4 * 60 + 30) * 60_000)).toBe('1 days 04:30');
    expect(formatTimeLeft(-(2 * 60 + 15) * 60_000)).toBe('-0 days 02:15');
    expect(timeLeft({ ...base, dueDate: '2026-11-13T09:15:00+07:00', slaHours: 72 })).toEqual({
      kind: 'ok', label: '2 days 00:15', minutes: 2 * 1440 + 15, overdue: false,
    });
  });

  it('past due and open → overdue with negative label', () => {
    const r = timeLeft({ ...base, dueDate: '2026-11-11T07:00:00+07:00' });
    expect(r).toMatchObject({ kind: 'overdue', overdue: true, label: '-0 days 02:00', minutes: -120 });
  });

  it('now === due is not overdue', () => {
    expect(timeLeft({ ...base, dueDate: formatIso(now) }).overdue).toBe(false);
  });

  it('closed status is never overdue', () => {
    const r = timeLeft({ ...base, status: 'Closed', dueDate: '2026-10-01T00:00:00+07:00' });
    expect(r).toMatchObject({ kind: 'closed', overdue: false });
    expect(isClosed('Department Declined')).toBe(true);
    expect(isClosed('Resolved')).toBe(false);
  });

  it('< 25% of SLA left → warning', () => {
    // P2 = 8h; 1h59m left < 2h
    expect(timeLeft({ ...base, dueDate: '2026-11-11T10:59:00+07:00', slaHours: 8 }).kind).toBe('warning');
    expect(timeLeft({ ...base, dueDate: '2026-11-11T11:00:00+07:00', slaHours: 8 }).kind).toBe('ok');
    expect(timeLeft({ ...base, dueDate: '2026-11-11T10:59:00+07:00' }).kind).toBe('ok');
  });

  it('awaiting approval → "รออนุมัติ" even without due date', () => {
    expect(timeLeft({ ...base, status: 'Waiting For Approve', awaitingApproval: true, dueDate: null })).toEqual({
      kind: 'awaiting', label: 'รออนุมัติ', minutes: null, overdue: false,
    });
  });

  it('no due date otherwise → "—"', () => {
    expect(timeLeft({ ...base, dueDate: null }).kind).toBe('none');
  });
});
