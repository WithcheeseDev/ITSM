import fc from 'fast-check';
import { describe, it } from 'vitest';
import { calcDueDate, formatIso, timeLeft } from '@/domain/sla';
import { AUTO_CLOSE_DAYS, shouldAutoClose } from '@/domain/stateMachine';
import { CALL_TYPES, PRIORITIES, STATUS_BY_CALL_TYPE, type Status } from '@/domain/types';
import { buildDataset } from '../fixtures';

const db = buildDataset();
const RUNS = { numRuns: 200 };
const DAY = 86_400_000;
const closedStatuses = db.enums.closedStatuses;
// whole seconds 2000-01-01 .. 2099-12-31 (formatIso has second precision); crosses day / month / year boundaries
const epochMs = fc.integer({ min: 946_684_800, max: 4_102_444_799 }).map((s) => s * 1000);
// elapsed time biased to the 7-day edge (±2s) so off-by-one boundaries are hit
const elapsedMs = fc.oneof(fc.integer({ min: -2 * DAY, max: 20 * DAY }), fc.integer({ min: -2000, max: 2000 }).map((d) => AUTO_CLOSE_DAYS * DAY + d));
const anyStatus = fc.constantFrom(...new Set(CALL_TYPES.flatMap((ct) => [...STATUS_BY_CALL_TYPE[ct]] as Status[])));

describe('P3 due date = start + SLA hours', () => {
  it('adds exactly slaHoursByPriority[p] hours', () => {
    fc.assert(
      fc.property(epochMs, fc.constantFrom(...PRIORITIES), (start, p) =>
        Date.parse(calcDueDate(formatIso(start), p, db.slaHoursByPriority)) - start === db.slaHoursByPriority[p] * 3_600_000),
      RUNS,
    );
  });
});

describe('P4 Time Left agrees with the clock', () => {
  it('overdue only when now > due and the call is not closed', () => {
    fc.assert(
      fc.property(epochMs, fc.integer({ min: -30 * DAY, max: 30 * DAY }), anyStatus, (due, delta, status) => {
        const now = due + delta;
        const t = timeLeft({ dueDate: formatIso(due), now, status, awaitingApproval: false, closedStatuses });
        const closed = closedStatuses.includes(status) || status === 'Resolved';
        return t.overdue === (!closed && now > due);
      }),
      RUNS,
    );
  });

  it('now === due is not overdue', () => {
    fc.assert(
      fc.property(epochMs, (due) => !timeLeft({ dueDate: formatIso(due), now: due, status: 'In Process', awaitingApproval: false, closedStatuses }).overdue),
      RUNS,
    );
  });

  it('awaiting approval on an open call shows "รออนุมัติ"', () => {
    fc.assert(
      fc.property(fc.option(epochMs, { nil: null }), epochMs, anyStatus, (due, now, status) => {
        fc.pre(!closedStatuses.includes(status) && status !== 'Resolved'); // Resolved stops the SLA (US-006 Add-on)
        const t = timeLeft({ dueDate: due === null ? null : formatIso(due), now, status, awaitingApproval: true, closedStatuses });
        return t.kind === 'awaiting' && t.label === 'รออนุมัติ' && !t.overdue;
      }),
      RUNS,
    );
  });
});

describe('P10 auto-close after the window', () => {
  it('shouldAutoClose ⟺ Resolved and now - resolvedAt > 7 days', () => {
    fc.assert(
      fc.property(epochMs, elapsedMs, anyStatus, (resolved, elapsed, status) => {
        const call = { id: 'c1', status, resolvedAt: formatIso(resolved) };
        return shouldAutoClose(call, [], resolved + elapsed) === (status === 'Resolved' && elapsed > AUTO_CLOSE_DAYS * DAY);
      }),
      RUNS,
    );
  });

  it('uses the latest → Resolved history entry when resolvedAt is missing', () => {
    fc.assert(
      fc.property(epochMs, elapsedMs, (resolved, elapsed) => {
        const history = [
          { id: 'h0', callId: 'c1', at: formatIso(resolved - 30 * DAY), byUserId: 'u', action: 'status_changed' as const, fromStatus: 'In Process' as const, toStatus: 'Resolved' as const, comment: null },
          { id: 'h1', callId: 'c1', at: formatIso(resolved), byUserId: 'u', action: 'status_changed' as const, fromStatus: 'Re-Opened' as const, toStatus: 'Resolved' as const, comment: null },
        ];
        const call = { id: 'c1', status: 'Resolved' as const, resolvedAt: null };
        return shouldAutoClose(call, history, resolved + elapsed) === elapsed > AUTO_CLOSE_DAYS * DAY;
      }),
      RUNS,
    );
  });
});
