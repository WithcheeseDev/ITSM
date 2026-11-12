import type { ReactNode } from 'react';
import type { Dataset, Priority, SupportCall } from '@/domain/types';
import { isClosed } from '@/domain/stateMachine';
import { formatDateTime } from './format';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { TimeLeft } from './TimeLeft';

/** Name lookups + SLA context a table row needs; built once per render from the dataset. */
export interface CallLookups {
  userName: (id: string | null) => string;
  queueName: (id: string) => string;
  groupName: (id: string) => string;
  orgName: (id: string | null) => string;
  templateName: (id: string | null) => string;
  slaHours: (p: Priority) => number;
  /** waiting for a pending approval and no due date yet (SLA starts after approval) */
  isAwaitingApproval: (call: SupportCall) => boolean;
  now: number;
}

export function buildCallLookups(d: Dataset, now: number): CallLookups {
  const byId = <T extends { id: string; name: string }>(list: readonly T[]) => new Map(list.map((x) => [x.id, x.name]));
  const users = byId(d.users);
  const queues = byId(d.queues);
  const groups = byId(d.groups);
  const orgs = byId(d.organizations);
  const templates = byId(d.templates);
  const pending = new Set(d.approvals.filter((a) => a.decision === 'pending').map((a) => a.callId));
  const name = (m: Map<string, string>, id: string | null) => (id ? (m.get(id) ?? '—') : '—');
  return {
    userName: (id) => name(users, id),
    queueName: (id) => name(queues, id),
    groupName: (id) => name(groups, id),
    orgName: (id) => name(orgs, id),
    templateName: (id) => name(templates, id),
    slaHours: (p) => d.slaHoursByPriority[p],
    isAwaitingApproval: (c) => c.dueDate === null && pending.has(c.id) && !isClosed(c.status, d.enums.closedStatuses),
    now,
  };
}

export interface CallColumn {
  id: string;
  label: string;
  render: (call: SupportCall, l: CallLookups) => ReactNode;
  /** right-aligned digits / dates: tabular figures, no wrapping */
  numeric?: boolean;
}

/**
 * All columns (FR-055). [ASM] "Subject Name" = requestor (who the call is for), "Requestor" column = opened by.
 * Read / Survey Result / Feedback Category are Nice (FR-056, FR-067) and not offered.
 */
export const CALL_COLUMNS: readonly CallColumn[] = [
  { id: 'number', label: 'Number', numeric: true, render: (c) => c.number },
  { id: 'callType', label: 'Call Type', render: (c) => <span className="whitespace-nowrap">{c.callType}</span> },
  { id: 'classification', label: 'Classification', render: (c) => c.classification },
  { id: 'category', label: 'Call Category', render: (c) => [c.parentCategory, c.category, c.subCategory].filter(Boolean).join(' / ') || '—' },
  { id: 'summary', label: 'Summary', render: (c) => c.summary },
  { id: 'subjectName', label: 'Subject Name', render: (c, l) => l.userName(c.requestorId) },
  { id: 'status', label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
  { id: 'priority', label: 'Priority', render: (c) => <PriorityBadge priority={c.priority} /> },
  { id: 'openDate', label: 'Open Date', numeric: true, render: (c) => formatDateTime(c.openDate) },
  { id: 'dueDate', label: 'Due Date', numeric: true, render: (c) => formatDateTime(c.dueDate) },
  {
    id: 'timeLeft',
    label: 'Time Left',
    render: (c, l) => (
      <TimeLeft dueDate={c.dueDate} now={l.now} status={c.status} awaitingApproval={l.isAwaitingApproval(c)} slaHours={l.slaHours(c.priority)} />
    ),
  },
  { id: 'closeDate', label: 'Close Date', numeric: true, render: (c) => formatDateTime(c.closeDate) },
  { id: 'queue', label: 'Queue', render: (c, l) => l.queueName(c.queueId) },
  { id: 'requestor', label: 'Requestor', render: (c, l) => l.userName(c.openedByUserId) },
  { id: 'group', label: 'Group', render: (c, l) => l.groupName(c.groupId) },
  { id: 'organization', label: 'Organization', render: (c, l) => l.orgName(c.organizationId) },
  { id: 'itsrReference', label: 'ITSR Reference', render: (c) => c.itsrReference ?? '—' },
  { id: 'template', label: 'Template Used', render: (c, l) => l.templateName(c.templateId) },
  { id: 'vvip', label: 'VVIP', render: (c) => (c.vvip ? 'VVIP' : '—') },
];

/** US-009 Add-on 2026-11-13: 5 columns so Time Left fits a 1280 screen (was FR-014's 8; the rest stay in the column picker) */
export const DEFAULT_COLUMN_IDS = ['number', 'summary', 'status', 'priority', 'timeLeft'] as const;
export const REQUIRED_COLUMN_ID = 'number';
