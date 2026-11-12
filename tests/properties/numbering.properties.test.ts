import fc from 'fast-check';
import { describe, it } from 'vitest';
import { nextNumber } from '@/domain/numbering';

const RUNS = { numRuns: 200 };
const pad = (n: number) => String(n).padStart(6, '0');

/** Create `count` calls in a row, feeding each result back like createCall does. */
function issue(start: number, count: number, existing: string[]): string[] {
  const taken = [...existing];
  const issued: string[] = [];
  let running = start;
  for (let k = 0; k < count; k += 1) {
    const r = nextNumber(running, taken);
    if (!r.ok) break;
    issued.push(r.data.number);
    taken.push(r.data.number);
    running = r.data.runningNumber;
  }
  return issued;
}

describe('P9 ticket numbers are unique and go up by one', () => {
  it('consecutive numbers with no collisions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999_000 }), fc.integer({ min: 1, max: 50 }), (start, count) => {
        const issued = issue(start, count, []);
        return issued.length === count && issued.every((n, k) => n === pad(start + 1 + k));
      }),
      RUNS,
    );
  });

  it('never reuses an existing number and is always 6 digits', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100_000, max: 100_100 }),
        fc.uniqueArray(fc.integer({ min: 100_000, max: 100_200 }).map(pad), { maxLength: 40 }),
        fc.integer({ min: 1, max: 30 }),
        (start, existing, count) => {
          const issued = issue(start, count, existing);
          return (
            issued.length === count &&
            new Set([...existing, ...issued]).size === existing.length + issued.length &&
            issued.every((n) => /^\d{6}$/.test(n)) &&
            issued.every((n, k) => k === 0 || Number(n) > Number(issued[k - 1]))
          );
        },
      ),
      RUNS,
    );
  });

  it('fails instead of going past 999999', () => {
    fc.assert(fc.property(fc.integer({ min: 999_999, max: 1_200_000 }), (current) => !nextNumber(current).ok), RUNS);
  });
});
