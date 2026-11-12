import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataStore } from '@/data/repositories';
import type { User } from '@/domain/types';
import {
  addComment, assignCall, cancelCall, changeStatus, createCall, getCall, listVisibleCalls, MESSAGES, reopenCall, runAutoClose,
  validateCallInput, type CallInput,
} from '@/features/calls/callService';
import { buildDataset, buildStore, FIXED_NOW } from '../../fixtures';

const NOW = Date.parse(FIXED_NOW);
const DAY = 86_400_000;
let store: DataStore;
const user = (id: string): User => {
  const u = store.getDataset().users.find((x) => x.id === id);
  if (!u) throw new Error(id);
  return u;
};
const call = (id: string) => store.getDataset().supportCalls.find((c) => c.id === id)!;
const historyOf = (id: string) => store.getDataset().callHistory.filter((h) => h.callId === id);

const input = (over: Partial<CallInput> = {}): CallInput => ({
  requestedFor: 'myself',
  requestorId: null,
  phone: '0811111111',
  email: 'somchai.j@example.com',
  customerReference: null,
  templateId: 'tpl_001',
  serviceDefinitionId: 'sdf_002',
  urgency: '3-Medium',
  impact: '4-Minor/Localized',
  serviceId: null,
  productId: null,
  itemId: null,
  serialNumber: null,
  summary: 'เมาส์เสีย',
  notes: '<p>คลิกไม่ติด</p>',
  attachments: [],
  ...over,
});

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  store = buildStore();
});

describe('validateCallInput', () => {
  it('returns the §4.5 messages for each bad field', () => {
    const errors = validateCallInput(
      input({
        requestedFor: 'somebody_else', requestorId: null, summary: ' ', notes: '<p> </p>', email: 'x@', phone: '12', templateId: '',
        attachments: Array.from({ length: 6 }, (_, i) => ({ name: `f${i}`, size: 1, type: 'text/plain' })),
      }),
    );
    expect(errors).toEqual({
      requestorId: MESSAGES.requestor, summary: MESSAGES.summary, notes: MESSAGES.notes, email: MESSAGES.email,
      phone: MESSAGES.phone, templateId: MESSAGES.template, attachments: MESSAGES.attachmentCount,
    });
  });

  it('flags a summary over 200 characters and an attachment over 10 MB', () => {
    const errors = validateCallInput(input({ summary: 'ก'.repeat(201), attachments: [{ name: 'big', size: 10 * 1024 * 1024 + 1, type: 'image/png' }] }));
    expect(errors).toEqual({ summary: MESSAGES.summaryLength, attachments: MESSAGES.attachmentSize });
  });
});

describe('createCall', () => {
  it('creates an Incident with number, priority, due date and a created history entry in one commit', () => {
    const commit = vi.spyOn(store, 'commit');
    const r = createCall(user('usr_001'), input({ notes: '<p onclick="x()">ok</p><script>bad()</script>' }), NOW, store);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(commit).toHaveBeenCalledTimes(1);
    expect(r.data).toMatchObject({ number: '100010', status: 'New', priority: 'P4', requestorId: 'usr_001', groupId: 'grp_002', dueDate: '2026-11-14T09:00:00+07:00' });
    expect(r.data.notes).toBe('<p>ok</p>');
    expect(store.getDataset().runningNumber.supportCall).toBe(100010);
    expect(historyOf(r.data.id)).toMatchObject([{ action: 'created', toStatus: 'New', byUserId: 'usr_001' }]);
  });

  it('creates the approval chain and waits for approval before the SLA starts', () => {
    const r = createCall(user('usr_001'), input({ templateId: 'tpl_005', serviceDefinitionId: 'sdf_010' }), NOW, store);
    expect(r.ok && r.data).toMatchObject({ status: 'Waiting For Approve', dueDate: null });
    const approvals = store.getDataset().approvals.filter((a) => r.ok && a.callId === r.data.id);
    expect(approvals.map((a) => [a.approvalType, a.approverId])).toEqual([['Department approval', 'usr_004'], ['Head approval', 'usr_005']]);
  });

  it('records on-behalf calls with the chosen requestor', () => {
    const r = createCall(user('usr_001'), input({ requestedFor: 'somebody_else', requestorId: 'usr_002' }), NOW, store);
    expect(r.ok && [r.data.requestorId, r.data.openedByUserId]).toEqual(['usr_002', 'usr_001']);
  });

  it('is FORBIDDEN without call:create', () => {
    const noCreate = { ...buildDataset(), rolePermissions: { ...buildDataset().rolePermissions, requestor: [] } };
    store = buildStore(noCreate);
    expect(createCall(user('usr_001'), input(), NOW, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });

  it('returns VALIDATION with field errors and saves nothing', () => {
    const r = createCall(user('usr_001'), input({ summary: '' }), NOW, store);
    expect(r).toMatchObject({ ok: false, error: { code: 'VALIDATION', fieldErrors: { summary: MESSAGES.summary } } });
    expect(store.getDataset().supportCalls).toHaveLength(9);
  });

  it('rejects urgency from the wrong level set (BR-02)', () => {
    const r = createCall(user('usr_001'), input({ urgency: 'RFC - Major' }), NOW, store);
    expect(r).toMatchObject({ ok: false, error: { code: 'VALIDATION' } });
  });

  it('fails with APPROVER_NOT_FOUND when the requestor has no manager', () => {
    const r = createCall(user('usr_003'), input({ templateId: 'tpl_004', serviceDefinitionId: 'sdf_009' }), NOW, store);
    expect(r).toMatchObject({ ok: false, error: { code: 'APPROVER_NOT_FOUND' } });
    expect(store.getDataset().supportCalls).toHaveLength(9);
  });
});

describe('listVisibleCalls / getCall', () => {
  it('lists only calls the actor may see, newest first', () => {
    const list = listVisibleCalls(user('usr_001'), store);
    expect(list.every((c) => c.requestorId === 'usr_001' || c.openedByUserId === 'usr_001')).toBe(true);
    expect(list.map((c) => c.openDate)).toEqual([...list.map((c) => c.openDate)].sort((a, b) => Date.parse(b) - Date.parse(a)));
    expect(listVisibleCalls(null, store)).toEqual([]);
  });

  it('returns NOT_FOUND for a missing call and for someone else\'s call', () => {
    expect(getCall(user('usr_001'), 'call_001', store).ok).toBe(true);
    expect(getCall(user('usr_001'), 'nope', store)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
    expect(getCall(user('usr_001'), 'call_003', store)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });
});

describe('assignCall', () => {
  it('moves New → Assigned for a group member', () => {
    const created = createCall(user('usr_001'), input(), NOW, store);
    if (!created.ok) throw new Error('setup');
    const r = assignCall(user('usr_006'), created.data.id, 'usr_006', NOW, store);
    expect(r.ok && [r.data.status, r.data.assignedToId]).toEqual(['Assigned', 'usr_006']);
    expect(historyOf(created.data.id).at(-1)).toMatchObject({ action: 'assigned', fromStatus: 'New', toStatus: 'Assigned' });
  });

  it('is FORBIDDEN for a requestor and NOT_FOUND for an agent of another group', () => {
    expect(assignCall(user('usr_001'), 'call_001', 'usr_006', NOW, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(assignCall(user('usr_007'), 'call_001', 'usr_007', NOW, store)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });

  it('rejects an assignee outside the group', () => {
    expect(assignCall(user('usr_006'), 'call_001', 'usr_007', NOW, store)).toMatchObject({
      ok: false, error: { code: 'VALIDATION', fieldErrors: { assigneeId: MESSAGES.assignee } },
    });
  });
});

describe('changeStatus', () => {
  it('Resolved needs a closure category and sets resolvedAt', () => {
    expect(changeStatus(user('usr_006'), 'call_001', 'In Process', {}, NOW, store).ok).toBe(true);
    expect(changeStatus(user('usr_006'), 'call_001', 'Resolved', {}, NOW, store)).toMatchObject({
      ok: false, error: { code: 'VALIDATION', fieldErrors: { closureCategory: MESSAGES.closureCategory } },
    });
    const r = changeStatus(user('usr_006'), 'call_001', 'Resolved', { closureCategory: 'Fixed', comment: ' เปลี่ยนเมาส์ ' }, NOW, store);
    expect(r.ok && r.data).toMatchObject({ status: 'Resolved', closureCategory: 'Fixed', resolvedAt: FIXED_NOW, closeDate: null });
    expect(historyOf('call_001').at(-1)).toMatchObject({ action: 'status_changed', toStatus: 'Resolved', comment: 'เปลี่ยนเมาส์' });
  });

  it('sets closeDate on a closed status', () => {
    const r = changeStatus(user('usr_006'), 'call_009', 'Closed', {}, NOW, store);
    expect(r.ok && r.data.closeDate).toBe(FIXED_NOW);
  });

  it('returns INVALID_TRANSITION for a move the state machine does not allow', () => {
    expect(changeStatus(user('usr_006'), 'call_001', 'Closed', {}, NOW, store)).toMatchObject({ ok: false, error: { code: 'INVALID_TRANSITION' } });
  });

  it('is FORBIDDEN for the requestor', () => {
    expect(changeStatus(user('usr_001'), 'call_001', 'In Process', {}, NOW, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });
});

describe('addComment', () => {
  it('adds a comment with attachment metadata only', () => {
    const file = { name: 'a.png', size: 10, type: 'image/png', extra: 'drop' } as never;
    const r = addComment(user('usr_001'), 'call_001', ' ยังเสียอยู่ ', [file], NOW, store);
    expect(r.ok).toBe(true);
    expect(historyOf('call_001').at(-1)).toMatchObject({ action: 'commented', comment: 'ยังเสียอยู่', attachments: [{ name: 'a.png', size: 10, type: 'image/png' }] });
    expect(historyOf('call_001').at(-1)?.attachments?.[0]).not.toHaveProperty('extra');
  });

  it('rejects an empty comment and too many attachments', () => {
    expect(addComment(user('usr_001'), 'call_001', '  ', [], NOW, store)).toMatchObject({ ok: false, error: { fieldErrors: { comment: MESSAGES.comment } } });
    const six = Array.from({ length: 6 }, (_, i) => ({ name: `f${i}`, size: 1, type: 'text/plain' }));
    expect(addComment(user('usr_001'), 'call_001', 'x', six, NOW, store)).toMatchObject({ ok: false, error: { fieldErrors: { attachments: MESSAGES.attachmentCount } } });
  });

  it('is FORBIDDEN on a closed call and for admin', () => {
    expect(addComment(user('usr_002'), 'call_004', 'x', [], NOW, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(addComment(user('usr_008'), 'call_001', 'x', [], NOW, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });
});

describe('cancelCall', () => {
  it('cancels the requestor\'s open call with the call type\'s cancel status', () => {
    expect(cancelCall(user('usr_001'), 'call_001', NOW, store)).toMatchObject({ ok: true, data: { status: 'Cancelled', closeDate: FIXED_NOW } });
    expect(cancelCall(user('usr_001'), 'call_005', NOW, store)).toMatchObject({ ok: true, data: { status: 'Request Cancelled' } });
  });

  it('is FORBIDDEN for a Resolved call and for an agent', () => {
    expect(cancelCall(user('usr_001'), 'call_009', NOW, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(cancelCall(user('usr_006'), 'call_001', NOW, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });
});

describe('reopenCall', () => {
  it('re-opens within 7 days and clears the closure category', () => {
    const r = reopenCall(user('usr_001'), 'call_009', NOW, store);
    expect(r.ok && r.data).toMatchObject({ status: 'Re-Opened', closureCategory: null, resolvedAt: null });
    expect(historyOf('call_009').at(-1)).toMatchObject({ action: 'reopened', fromStatus: 'Resolved', toStatus: 'Re-Opened' });
  });

  it('is FORBIDDEN after the 7-day window and for someone else', () => {
    const resolved = Date.parse(call('call_009').resolvedAt!);
    expect(reopenCall(user('usr_001'), 'call_009', resolved + 8 * DAY, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
    expect(reopenCall(user('usr_006'), 'call_009', NOW, store)).toMatchObject({ ok: false, error: { code: 'FORBIDDEN' } });
  });
});

describe('runAutoClose', () => {
  it('closes only calls Resolved for more than 7 days, as system', () => {
    const resolved = Date.parse(call('call_009').resolvedAt!);
    expect(runAutoClose(resolved + 7 * DAY, store)).toEqual({ ok: true, data: 0 });
    expect(runAutoClose(resolved + 7 * DAY + 1000, store)).toEqual({ ok: true, data: 1 });
    expect(call('call_009')).toMatchObject({ status: 'Closed' });
    expect(historyOf('call_009').at(-1)).toMatchObject({ byUserId: 'system', action: 'auto_closed', toStatus: 'Closed' });
    expect(runAutoClose(resolved + 30 * DAY, store)).toEqual({ ok: true, data: 0 });
  });
});
