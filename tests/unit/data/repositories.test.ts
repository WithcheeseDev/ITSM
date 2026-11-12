import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDataStore } from '@/data/repositories';
import { STORAGE_KEY } from '@/data/storage';
import type { CallHistory } from '@/domain/types';

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

describe('dataStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('repository reads by id and lists', () => {
    const store = createDataStore(() => localStorage);
    const calls = store.repository('supportCalls');
    expect(calls.findAll()).toHaveLength(9);
    expect(calls.findById('call_001')?.summary).toBe('Mouse ใช้งานไม่ได้');
    expect(calls.findById('nope')).toBeUndefined();
  });

  it('commit writes several collections with exactly one setItem', () => {
    const store = createDataStore(() => localStorage);
    store.getDataset();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const d = store.getDataset();
    const entry: CallHistory = {
      id: 'his_new', callId: 'call_001', at: '2026-11-11T10:00:00+07:00', byUserId: 'usr_006',
      action: 'status_changed', fromStatus: 'Assigned', toStatus: 'In Process', comment: null,
    };
    const r = store.commit({
      supportCalls: d.supportCalls.map((c) => (c.id === 'call_001' ? { ...c, status: 'In Process' } : c)),
      callHistory: [...d.callHistory, entry],
    });
    expect(r.ok).toBe(true);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(store.repository('supportCalls').findById('call_001')?.status).toBe('In Process');
    expect(stored().callHistory).toHaveLength(10);
  });

  it('commit with an invalid record is rejected and nothing changes', () => {
    const store = createDataStore(() => localStorage);
    const d = store.getDataset();
    const before = localStorage.getItem(STORAGE_KEY);
    const r = store.commit({ supportCalls: d.supportCalls.map((c) => ({ ...c, priority: 'P9' as never })) });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error.code).toBe('VALIDATION');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before);
    expect(store.repository('supportCalls').findById('call_001')?.priority).toBe('P4');
  });

  it('failed write (quota) keeps memory and storage unchanged', () => {
    const store = createDataStore(() => localStorage);
    store.getDataset();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const r = store.repository('supportCalls').update('call_001', { summary: 'changed' });
    expect(!r.ok && r.error.code).toBe('STORAGE_FULL');
    expect(store.repository('supportCalls').findById('call_001')?.summary).toBe('Mouse ใช้งานไม่ได้');
  });

  it('create rejects duplicate id, update rejects unknown id', () => {
    const repo = createDataStore(() => localStorage).repository('approvals');
    const existing = repo.findById('apv_001')!;
    expect(!repo.create(existing).ok).toBe(true);
    const missing = repo.update('apv_999', { done: true });
    expect(!missing.ok && missing.error.code).toBe('NOT_FOUND');
    expect(repo.update('apv_001', { done: true, decision: 'approved' }).ok).toBe(true);
    expect(repo.findById('apv_001')?.decision).toBe('approved');
  });

  it('resetToSeed restores seed after changes; data survives a new store instance', () => {
    const store = createDataStore(() => localStorage);
    store.commit({ runningNumber: { supportCall: 100100 } });
    expect(createDataStore(() => localStorage).getDataset().runningNumber.supportCall).toBe(100100);
    expect(store.resetToSeed().ok).toBe(true);
    expect(store.getDataset().runningNumber.supportCall).toBe(100009);
    expect(stored().runningNumber.supportCall).toBe(100009);
  });

  it('exposes the load warning once', () => {
    localStorage.setItem(STORAGE_KEY, 'garbage');
    const store = createDataStore(() => localStorage);
    expect(store.takeLoadWarning()?.code).toBe('STORAGE_CORRUPT');
    expect(store.takeLoadWarning()).toBeNull();
  });
});
