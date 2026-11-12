/** BR-04 — due date (24×7) and Time Left label. `now` is always an argument (deterministic tests). */
import { isClosed } from './stateMachine';
import type { IsoDate, Priority, Status } from './types';

const MINUTE = 60_000;
const HOUR = 3_600_000;
/** Dataset dates use +07:00 (`_meta.dateFormat`) */
export const APP_OFFSET_MINUTES = 7 * 60;
export const NEAR_DUE_RATIO = 0.25;

const pad = (n: number): string => String(n).padStart(2, '0');

/** Format epoch ms as ISO 8601 with a fixed offset, e.g. 2026-11-11T09:00:00+07:00 */
export function formatIso(ms: number, offsetMinutes = APP_OFFSET_MINUTES): IsoDate {
  const d = new Date(ms + offsetMinutes * MINUTE);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

/** dueDate = start + slaHours[priority] hours (start = openDate, or final approval time when the category waits for approval). */
export function calcDueDate(start: IsoDate, priority: Priority, slaHours: Record<Priority, number>): IsoDate {
  return formatIso(Date.parse(start) + slaHours[priority] * HOUR);
}


/** "X days hh:mm", negative with a leading "-" (US-006). */
export function formatTimeLeft(diffMs: number): string {
  const total = Math.floor(Math.abs(diffMs) / MINUTE);
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const minutes = total % 60;
  return `${diffMs < 0 ? '-' : ''}${days} days ${pad(hours)}:${pad(minutes)}`;
}

export type TimeLeftKind = 'awaiting' | 'none' | 'ok' | 'warning' | 'overdue' | 'closed';

export interface TimeLeft {
  kind: TimeLeftKind;
  label: string;
  /** due − now in whole minutes (toward zero); null when there is no due date */
  minutes: number | null;
  overdue: boolean;
}

export interface TimeLeftInput {
  dueDate: IsoDate | null;
  now: Date | number;
  status: Status;
  /** waiting for approval in a category with slaStartsAfterApproval = true */
  awaitingApproval: boolean;
  /** total SLA hours of the call's priority — enables the < 25% warning */
  slaHours?: number;
  closedStatuses?: readonly string[];
}

export function timeLeft({ dueDate, now, status, awaitingApproval, slaHours, closedStatuses }: TimeLeftInput): TimeLeft {
  const closed = isClosed(status, closedStatuses);
  if (awaitingApproval && !closed) return { kind: 'awaiting', label: 'รออนุมัติ', minutes: null, overdue: false };
  if (!dueDate) return { kind: 'none', label: '—', minutes: null, overdue: false };

  const diff = Date.parse(dueDate) - (typeof now === 'number' ? now : now.getTime());
  const base = { label: formatTimeLeft(diff), minutes: Math.trunc(diff / MINUTE) };
  if (closed) return { ...base, kind: 'closed', overdue: false };
  if (diff < 0) return { ...base, kind: 'overdue', overdue: true };
  const nearDue = slaHours !== undefined && diff < slaHours * HOUR * NEAR_DUE_RATIO;
  return { ...base, kind: nearDue ? 'warning' : 'ok', overdue: false };
}
