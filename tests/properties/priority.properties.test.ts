import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { calcPriority } from '@/domain/priority';
import { IMPACT_RFC, IMPACT_STANDARD, PRIORITIES, URGENCY_RFC, URGENCY_STANDARD, type CallType, type Priority } from '@/domain/types';
import { buildDataset } from '../fixtures';

const db = buildDataset();
const RUNS = { numRuns: 200 };
const STANDARD_TYPES: CallType[] = ['Incident', 'Problem', 'Request Fulfilment (ITSR)', 'Service Requests'];
const num = (level: string) => level.split('-')[0];
const rank = (p: Priority) => PRIORITIES.indexOf(p); // P1 = 0 (most severe)

describe('P1 priority stays inside the matrix', () => {
  it('returns the matrix value for every valid standard pair', () => {
    fc.assert(
      fc.property(fc.constantFrom(...STANDARD_TYPES), fc.constantFrom(...URGENCY_STANDARD), fc.constantFrom(...IMPACT_STANDARD), (ct, u, i) => {
        const r = calcPriority(ct, u, i, db);
        return r.ok && r.data === db.priorityMatrix[`${num(u)}-${num(i)}`] && PRIORITIES.includes(r.data);
      }),
      RUNS,
    );
  });

  it('returns the RFC matrix value for every valid RFC pair', () => {
    fc.assert(
      fc.property(fc.constantFrom(...URGENCY_RFC), fc.constantFrom(...IMPACT_RFC), (u, i) => {
        const r = calcPriority('Change (RFC)', u, i, db);
        return r.ok && r.data === db.rfcPriorityMatrix[u];
      }),
      RUNS,
    );
  });

  it('fails when the level set does not match the call type (BR-02)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...STANDARD_TYPES), fc.constantFrom(...URGENCY_RFC), fc.constantFrom(...IMPACT_STANDARD, ...IMPACT_RFC), (ct, u, i) =>
        !calcPriority(ct, u, i, db).ok),
      RUNS,
    );
    fc.assert(
      fc.property(fc.constantFrom(...URGENCY_STANDARD), fc.constantFrom(...IMPACT_STANDARD, ...IMPACT_RFC), (u, i) =>
        !calcPriority('Change (RFC)', u, i, db).ok),
      RUNS,
    );
  });
});

describe('P2 priority is monotonic', () => {
  const prio = (u: number, i: number): Priority => {
    const r = calcPriority('Incident', URGENCY_STANDARD[u - 1]!, IMPACT_STANDARD[i - 1]!, db);
    if (!r.ok) throw new Error(`no priority for ${u}-${i}`);
    return r.data;
  };
  const level = fc.integer({ min: 1, max: 4 });

  it('more severe urgency never gives a lower priority', () => {
    fc.assert(fc.property(fc.integer({ min: 2, max: 4 }), level, (u, i) => rank(prio(u - 1, i)) <= rank(prio(u, i))), RUNS);
  });

  it('more severe impact never gives a lower priority', () => {
    fc.assert(fc.property(level, fc.integer({ min: 2, max: 4 }), (u, i) => rank(prio(u, i - 1)) <= rank(prio(u, i))), RUNS);
  });

  it('corner cells 1-4 and 4-1 are valid priorities', () => {
    expect(PRIORITIES).toContain(prio(1, 4));
    expect(PRIORITIES).toContain(prio(4, 1));
  });
});
