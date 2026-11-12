/** BR-01 / BR-02 — priority from Urgency × Impact, matrices read from the dataset (D1-4). */
import {
  fail, IMPACT_RFC, IMPACT_STANDARD, ok, PRIORITIES, URGENCY_RFC, URGENCY_STANDARD,
  type CallType, type Impact, type Priority, type Result, type Urgency,
} from './types';

export interface PriorityMatrices {
  priorityMatrix: Record<string, string>;
  rfcPriorityMatrix: Record<string, string>;
}

export const PRIORITY_ERROR = 'ไม่สามารถคำนวณ priority ได้';
const RFC: CallType = 'Change (RFC)';

export const isRfc = (callType: CallType): boolean => callType === RFC;

/** Level sets that are valid for a call type (BR-02). */
export function levelsFor(callType: CallType): { urgency: readonly Urgency[]; impact: readonly Impact[] } {
  return isRfc(callType)
    ? { urgency: URGENCY_RFC, impact: IMPACT_RFC }
    : { urgency: URGENCY_STANDARD, impact: IMPACT_STANDARD };
}

const levelNo = (level: string): string => level.split('-')[0] ?? '';
const isPriority = (v: unknown): v is Priority => (PRIORITIES as readonly unknown[]).includes(v);

export function calcPriority(callType: CallType, urgency: Urgency, impact: Impact, m: PriorityMatrices): Result<Priority> {
  const levels = levelsFor(callType);
  if (!levels.urgency.includes(urgency) || !levels.impact.includes(impact)) {
    return fail('VALIDATION', { priority: PRIORITY_ERROR });
  }
  const value = isRfc(callType) ? m.rfcPriorityMatrix[urgency] : m.priorityMatrix[`${levelNo(urgency)}-${levelNo(impact)}`];
  return isPriority(value) ? ok(value) : fail('VALIDATION', { priority: PRIORITY_ERROR });
}
