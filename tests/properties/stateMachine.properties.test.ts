import fc from 'fast-check';
import { describe, it } from 'vitest';
import { assertTransition, initialStatus, nextStatuses } from '@/domain/stateMachine';
import { CALL_TYPES, STATUS_BY_CALL_TYPE, type Status } from '@/domain/types';
import { buildDataset } from '../fixtures';

const RUNS = { numRuns: 200 };
const closedStatuses = buildDataset().enums.closedStatuses;
const statusesOf = (ct: (typeof CALL_TYPES)[number]) => STATUS_BY_CALL_TYPE[ct] as readonly Status[];
const callType = fc.constantFrom(...CALL_TYPES);
const pairInType = callType.chain((ct) => fc.tuple(fc.constant(ct), fc.constantFrom(...statusesOf(ct)), fc.constantFrom(...statusesOf(ct))));

describe('P5 state machine stays inside the call type', () => {
  it('nextStatuses ⊆ statusByCallType', () => {
    fc.assert(
      fc.property(callType.chain((ct) => fc.tuple(fc.constant(ct), fc.constantFrom(...statusesOf(ct)))), ([ct, s]) =>
        nextStatuses(ct, s).every((n) => statusesOf(ct).includes(n))),
      RUNS,
    );
  });

  it('assertTransition succeeds ⟺ target is in nextStatuses', () => {
    fc.assert(fc.property(pairInType, ([ct, a, b]) => assertTransition(ct, a, b).ok === nextStatuses(ct, a).includes(b)), RUNS);
  });

  // Requirements §4.4: Completed / Failed / Request Completed (in closedStatuses) still move on to Closed — nothing else
  it('closed statuses can only move on to Closed', () => {
    fc.assert(
      fc.property(callType.chain((ct) => fc.tuple(fc.constant(ct), fc.constantFrom(...statusesOf(ct)))), ([ct, s]) =>
        !closedStatuses.includes(s) || nextStatuses(ct, s).every((n) => n === 'Closed')),
      RUNS,
    );
  });

  it('Closed, Cancelled and Request Cancelled are terminal', () => {
    fc.assert(
      fc.property(callType, fc.constantFrom<Status>('Closed', 'Cancelled', 'Request Cancelled'), (ct, s) => nextStatuses(ct, s).length === 0),
      RUNS,
    );
  });
});

describe('P6 random walks never leave the call type', () => {
  it('every visited status belongs to the call type', () => {
    fc.assert(
      fc.property(callType, fc.boolean(), fc.array(fc.nat(), { maxLength: 20 }), (ct, needsApproval, picks) => {
        let s = initialStatus(ct, { requiresApproval: needsApproval ? ['Department approval'] : [] });
        if (!statusesOf(ct).includes(s)) return false;
        for (const pick of picks) {
          const options = nextStatuses(ct, s);
          if (options.length === 0) break;
          s = options[pick % options.length]!;
          if (!statusesOf(ct).includes(s)) return false;
        }
        return true;
      }),
      RUNS,
    );
  });
});
