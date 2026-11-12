/** US-020 / US-021 — search criteria, validation and filtering (pure; visibility is applied before this). */
import { isClosed } from '@/domain/stateMachine';
import type { CallType, Status, SupportCall } from '@/domain/types';
import { matchFullText, type FullTextMode } from './fullText';

export type OpenClosed = 'all' | 'open' | 'closed';

export interface SearchCriteria {
  number: string;
  status: Status | '';
  openFrom: string; // yyyy-mm-dd
  openTo: string;
  summary: string;
  subjectName: string;
  callType: CallType | 'all';
  openClosed: OpenClosed;
  itsrReference: string;
  templateId: string;
  fullText: string;
  fullTextMode: FullTextMode;
}

/** US-020 default: Open + All call types. */
export const DEFAULT_CRITERIA: SearchCriteria = {
  number: '',
  status: '',
  openFrom: '',
  openTo: '',
  summary: '',
  subjectName: '',
  callType: 'all',
  openClosed: 'open',
  itsrReference: '',
  templateId: '',
  fullText: '',
  fullTextMode: 'natural',
};

export const DATE_RANGE_ERROR = 'ช่วงวันที่ไม่ถูกต้อง';

export function validateCriteria(c: SearchCriteria): Record<string, string> {
  return c.openFrom && c.openTo && c.openFrom > c.openTo ? { openTo: DATE_RANGE_ERROR } : {};
}

export interface SearchContext {
  closedStatuses: readonly string[];
  userName: (id: string) => string;
  /** lower-cased Summary + Notes text of a call (precomputed once per dataset) */
  haystack: (call: SupportCall) => string;
}

const contains = (value: string | null | undefined, needle: string) =>
  !needle.trim() || (value ?? '').toLowerCase().includes(needle.trim().toLowerCase());

export function filterCalls(calls: readonly SupportCall[], c: SearchCriteria, ctx: SearchContext): SupportCall[] {
  return calls.filter((call) => {
    // openDate is stored with the +07:00 offset, so its first 10 chars are the local (Bangkok) date
    const openDay = call.openDate.slice(0, 10);
    const closed = isClosed(call.status, ctx.closedStatuses);
    return (
      contains(call.number, c.number) &&
      (!c.status || call.status === c.status) &&
      (!c.openFrom || openDay >= c.openFrom) &&
      (!c.openTo || openDay <= c.openTo) &&
      contains(call.summary, c.summary) &&
      contains(ctx.userName(call.requestorId), c.subjectName) &&
      (c.callType === 'all' || call.callType === c.callType) &&
      (c.openClosed === 'all' || (c.openClosed === 'closed') === closed) &&
      contains(call.itsrReference, c.itsrReference) &&
      (!c.templateId || call.templateId === c.templateId) &&
      matchFullText(c.fullText, c.fullTextMode, ctx.haystack(call))
    );
  });
}
