import { describe, expect, it } from 'vitest';
import { nextNumber } from '@/domain/numbering';
import { seedDataset } from '@/data/storage';

describe('nextNumber', () => {
  it('runningNumber + 1 as 6 digits', () => {
    expect(nextNumber(seedDataset().runningNumber.supportCall)).toEqual({ ok: true, data: { number: '100010', runningNumber: 100010 } });
    expect(nextNumber(41)).toEqual({ ok: true, data: { number: '000042', runningNumber: 42 } });
  });

  it('skips numbers already used by existing calls', () => {
    const r = nextNumber(100009, ['100010', '100011']);
    expect(r).toEqual({ ok: true, data: { number: '100012', runningNumber: 100012 } });
  });

  it('sequential calls are unique and consecutive', () => {
    let current = 100009;
    const seen: string[] = [];
    for (let k = 0; k < 50; k++) {
      const r = nextNumber(current, seen);
      if (!r.ok) throw new Error('unexpected');
      seen.push(r.data.number);
      current = r.data.runningNumber;
    }
    expect(new Set(seen).size).toBe(50);
    expect(seen[49]).toBe('100059');
  });

  it('beyond 999999 → error', () => {
    expect(nextNumber(999_999).ok).toBe(false);
  });
});
