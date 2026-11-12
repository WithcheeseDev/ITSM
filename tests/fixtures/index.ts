/**
 * Test data builders (testing-strategy.md — fixtures): start from the bundled seed (fictional data only, PDPA §14)
 * and override just the fields a test cares about. Every call returns a fresh deep copy.
 */
import { createDataStore, type DataStore } from '@/data/repositories';
import { saveDataset, seedDataset } from '@/data/storage';
import type { Dataset, SupportCall, User } from '@/domain/types';

/** Fixed clock for component tests: `vi.setSystemTime(FIXED_NOW)`. */
export const FIXED_NOW = '2026-11-11T09:00:00+07:00';

export function buildDataset(overrides: Partial<Dataset> = {}): Dataset {
  return { ...structuredClone(seedDataset()), ...structuredClone(overrides) };
}

/** Seed call `call_001` (Incident, Assigned) with overrides. */
export function buildCall(overrides: Partial<SupportCall> = {}): SupportCall {
  const base = seedDataset().supportCalls.find((c) => c.id === 'call_001');
  if (!base) throw new Error('seed call_001 missing');
  return { ...structuredClone(base), ...overrides };
}

/** Seed user `usr_001` (requestor) with overrides. */
export function buildUser(overrides: Partial<User> = {}): User {
  const base = seedDataset().users.find((u) => u.id === 'usr_001');
  if (!base) throw new Error('seed usr_001 missing');
  return { ...structuredClone(base), ...overrides };
}

/** A DataStore on jsdom localStorage pre-loaded with `dataset` (default: seed). */
export function buildStore(dataset: Dataset = buildDataset()): DataStore {
  const saved = saveDataset(localStorage, dataset);
  if (!saved.ok) throw new Error('could not save test dataset');
  return createDataStore(() => localStorage);
}
