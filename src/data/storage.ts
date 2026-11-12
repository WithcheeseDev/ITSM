/**
 * localStorage persistence of the whole dataset under one key (C10, D3-2).
 * Missing key → seed · unreadable / invalid → reset to seed + STORAGE_CORRUPT warning (US-001)
 * · write failure (quota) → STORAGE_FULL, previous value untouched (setItem is atomic).
 */
import { fail, ok, type AppError, type Dataset, type Result } from '@/domain/types';
import { logger } from '@/shared/logger';
import { datasetSchema } from './schemas';
import { normalizeDataset, rawSeedDataset } from './seed';

export const STORAGE_KEY = 'itsm.db.v1';

export interface LoadOutcome {
  dataset: Dataset;
  /** Shown to the user once (toast) — null when load was clean */
  warning: AppError | null;
}

export function parseDataset(raw: unknown): Dataset | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const parsed = datasetSchema.safeParse(normalizeDataset(raw as Record<string, unknown>));
  if (!parsed.success) {
    logger.error('storage.schemaInvalid', { issueCount: parsed.error.issues.length, paths: parsed.error.issues.slice(0, 5).map((i) => i.path.join('.')) });
    return null;
  }
  return parsed.data;
}

export function seedDataset(): Dataset {
  const seed = parseDataset(rawSeedDataset());
  // Programming error: the bundled seed must always satisfy the schema (guarded by tests)
  if (!seed) throw new Error('Bundled seed dataset failed schema validation');
  return seed;
}

const isQuotaError = (e: unknown): boolean =>
  e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22);

export function saveDataset(storage: Storage, dataset: Dataset): Result<void> {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    return ok(undefined);
  } catch (e) {
    // shortcut: every write failure maps to STORAGE_FULL (the only write error code in AppError); quota is the realistic case
    logger.error('storage.writeFailed', { code: 'STORAGE_FULL', quota: isQuotaError(e), error: e instanceof Error ? e : undefined });
    return fail('STORAGE_FULL');
  }
}

/**
 * data-model Add-on 2026-11-13: stored data older than SCHEMA_VERSION takes the seed's reference data;
 * calls, history, approvals, activities and the running number stay as the user left them.
 */
export function upgradeReferenceData(storage: Storage, dataset: Dataset): Dataset {
  const seed = seedDataset();
  if (dataset.schemaVersion >= seed.schemaVersion) return dataset;
  // reference data the app never edits (no admin pages)
  const upgraded: Dataset = {
    ...dataset,
    schemaVersion: seed.schemaVersion,
    serviceCategories: seed.serviceCategories,
    serviceDefinitions: seed.serviceDefinitions,
    templates: seed.templates,
    services: seed.services,
    queues: seed.queues,
    groups: seed.groups,
    users: seed.users,
  };
  saveDataset(storage, upgraded);
  logger.info('storage.upgraded', { schemaVersion: upgraded.schemaVersion });
  return upgraded;
}

export function loadDataset(storage: Storage): LoadOutcome {
  let text: string | null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch (e) {
    logger.error('storage.readFailed', { error: e instanceof Error ? e : undefined });
    return { dataset: seedDataset(), warning: null };
  }

  if (text === null) {
    const dataset = seedDataset();
    saveDataset(storage, dataset);
    logger.info('storage.seeded', { schemaVersion: dataset.schemaVersion });
    return { dataset, warning: null };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = null;
  }
  const dataset = parseDataset(raw);
  if (dataset) return { dataset: upgradeReferenceData(storage, dataset), warning: null };

  logger.error('storage.corruptReset', { code: 'STORAGE_CORRUPT' });
  const seed = seedDataset();
  saveDataset(storage, seed);
  const corrupt = fail('STORAGE_CORRUPT');
  return { dataset: seed, warning: corrupt.ok ? null : corrupt.error };
}
