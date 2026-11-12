/** BR-06 / US-008 — 6-digit ticket number from runningNumber.supportCall + 1, never reusing an existing number. */
import { fail, ok, type Result } from './types';

const MAX = 999_999;

export interface NextNumber {
  /** ticket number to store on the call */
  number: string;
  /** new value for runningNumber.supportCall — commit together with the call */
  runningNumber: number;
}

export function nextNumber(current: number, existing: Iterable<string> = []): Result<NextNumber> {
  const taken = new Set(existing);
  let n = current + 1;
  while (taken.has(String(n).padStart(6, '0'))) n += 1;
  if (!Number.isInteger(n) || n < 1 || n > MAX) return fail('VALIDATION', { number: 'เลข ticket เต็ม' });
  return ok({ number: String(n).padStart(6, '0'), runningNumber: n });
}
