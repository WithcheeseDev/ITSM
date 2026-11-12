import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACTIVITY_STATUSES, ACTIVITY_TYPES, APPROVAL_DECISIONS, APPROVAL_TYPES, CALL_TYPES, CLASSIFICATIONS, CLOSED_STATUSES,
  CLOSURE_CATEGORIES, FEEDBACK_CATEGORIES, IMPACT_RFC, IMPACT_STANDARD, ROLES, STATUS_BY_CALL_TYPE, URGENCY_RFC, URGENCY_STANDARD,
} from '@/domain/types';
import { deriveResolvedAt } from '@/data/seed';
import { loadDataset, saveDataset, seedDataset, STORAGE_KEY } from '@/data/storage';

const quiet = () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
};

describe('seed', () => {
  it('bundled database.json passes the schema and gets schemaVersion 1', () => {
    const d = seedDataset();
    expect(d.schemaVersion).toBe(1);
    expect(d.supportCalls).toHaveLength(9);
    expect(d.runningNumber.supportCall).toBe(100009);
  });

  it('keeps RFC planning dates (no silent strip)', () => {
    expect(seedDataset().supportCalls.find((c) => c.id === 'call_008')?.scheduledDate).toBe('2026-11-28T22:00:00+07:00');
  });

  it('derives resolvedAt from the latest "→ Resolved" history entry', () => {
    const calls = seedDataset().supportCalls;
    const byId = (id: string) => calls.find((c) => c.id === id)?.resolvedAt;
    expect(byId('call_009')).toBe('2026-11-08T11:00:00+07:00');
    expect(byId('call_004')).toBe('2026-10-21T10:30:00+07:00');
    expect(byId('call_001')).toBeNull();
    expect(
      deriveResolvedAt('c', [
        { id: 'a', callId: 'c', at: '2026-01-02T00:00:00+07:00', byUserId: 'u', action: 'status_changed', fromStatus: 'In Process', toStatus: 'Resolved', comment: null },
        { id: 'b', callId: 'c', at: '2026-01-05T00:00:00+07:00', byUserId: 'u', action: 'status_changed', fromStatus: 'Re-Opened', toStatus: 'Resolved', comment: null },
      ]),
    ).toBe('2026-01-05T00:00:00+07:00');
  });

  it('domain enum constants match database.json enums', () => {
    const e = seedDataset().enums;
    expect(e.callTypes).toEqual([...CALL_TYPES]);
    expect(e.classifications).toEqual([...CLASSIFICATIONS]);
    expect(e.urgency).toEqual({ standard: [...URGENCY_STANDARD], rfc: [...URGENCY_RFC] });
    expect(e.impact).toEqual({ standard: [...IMPACT_STANDARD], rfc: [...IMPACT_RFC] });
    expect(e.statusByCallType).toEqual(STATUS_BY_CALL_TYPE);
    expect(e.closedStatuses).toEqual([...CLOSED_STATUSES]);
    expect(e.activityTypes).toEqual([...ACTIVITY_TYPES]);
    expect(e.activityStatuses).toEqual([...ACTIVITY_STATUSES]);
    expect(e.approvalTypes).toEqual([...APPROVAL_TYPES]);
    expect(e.approvalDecisions).toEqual([...APPROVAL_DECISIONS]);
    expect(e.closureCategories).toEqual([...CLOSURE_CATEGORIES]);
    expect(e.feedbackCategories).toEqual([...FEEDBACK_CATEGORIES]);
    expect(e.roles).toEqual([...ROLES]);
  });
});

describe('loadDataset', () => {
  beforeEach(() => {
    localStorage.clear();
    quiet();
  });
  afterEach(() => vi.restoreAllMocks());

  it('no key → loads seed and writes it under itsm.db.v1', () => {
    const { dataset, warning } = loadDataset(localStorage);
    expect(warning).toBeNull();
    expect(dataset.users).toHaveLength(8);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').schemaVersion).toBe(1);
  });

  it('valid stored data is returned as is', () => {
    const d = seedDataset();
    d.runningNumber.supportCall = 100050;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    expect(loadDataset(localStorage)).toMatchObject({ warning: null, dataset: { runningNumber: { supportCall: 100050 } } });
  });

  it('broken JSON → reset to seed with STORAGE_CORRUPT warning', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    const { dataset, warning } = loadDataset(localStorage);
    expect(warning?.code).toBe('STORAGE_CORRUPT');
    expect(warning?.message).toBeTruthy();
    expect(dataset.runningNumber.supportCall).toBe(100009);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null').runningNumber.supportCall).toBe(100009);
  });

  it('schema-invalid data (bad status) → reset to seed with warning', () => {
    const d = seedDataset() as unknown as { supportCalls: { status: string }[] };
    d.supportCalls[0]!.status = 'Teleported';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    expect(loadDataset(localStorage).warning?.code).toBe('STORAGE_CORRUPT');
  });

  it('older stored data without resolvedAt is upgraded, not reset', () => {
    const d = seedDataset() as unknown as { supportCalls: Record<string, unknown>[] };
    d.supportCalls.forEach((c) => delete c.resolvedAt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    const { dataset, warning } = loadDataset(localStorage);
    expect(warning).toBeNull();
    expect(dataset.supportCalls.find((c) => c.id === 'call_009')?.resolvedAt).toBe('2026-11-08T11:00:00+07:00');
  });
});

describe('saveDataset', () => {
  afterEach(() => vi.restoreAllMocks());

  it('quota error → STORAGE_FULL and previous value is untouched', () => {
    quiet();
    localStorage.setItem(STORAGE_KEY, 'previous');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const r = saveDataset(localStorage, seedDataset());
    expect(r).toEqual({ ok: false, error: { code: 'STORAGE_FULL', message: 'พื้นที่จัดเก็บเต็ม' } });
    vi.restoreAllMocks();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('previous');
  });
});

describe('attachment normalization (Add-on: seed shape → model shape)', () => {
  it('maps { id, fileName, sizeKb } to { name, size bytes, type }', () => {
    const call = seedDataset().supportCalls.find((c) => c.id === 'call_002');
    expect(call?.attachments).toEqual([{ name: 'screenshot-report.png', size: 245 * 1024, type: 'image/png' }]);
    expect(seedDataset().supportCalls.find((c) => c.id === 'call_008')?.attachments[0]?.type).toBe('application/pdf');
  });

  it('leaves model-shaped attachments untouched', async () => {
    const { normalizeAttachments } = await import('@/data/seed');
    const a = [{ name: 'x.bin', size: 10, type: 'application/octet-stream' }];
    expect(normalizeAttachments(a)).toEqual(a);
  });
});
