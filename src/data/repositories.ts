/**
 * Repository layer (C10). The whole dataset lives in memory and is written to storage in ONE setItem per commit.
 * Use cases build their changes and call `commit(changes)` once (Business Rule 5: call + history in the same commit).
 */
import { fail, ok, type AppError, type Dataset, type EntityKey, type Result } from '@/domain/types';
import { logger } from '@/shared/logger';
import { datasetSchema } from './schemas';
import { loadDataset, saveDataset, seedDataset } from './storage';

export type EntityOf<K extends EntityKey> = Dataset[K][number];

export interface Repository<T extends { id: string }> {
  findAll(): readonly T[];
  findById(id: string): T | undefined;
  /** Commits immediately — for use cases touching one collection; multi-collection changes use `commit`. */
  create(item: T): Result<void>;
  update(id: string, patch: Partial<Omit<T, 'id'>>): Result<void>;
}

export interface DataStore {
  getDataset(): Dataset;
  /** Warning from the first load (e.g. STORAGE_CORRUPT) — read once by the UI to show a toast */
  takeLoadWarning(): AppError | null;
  commit(changes: Partial<Dataset>): Result<void>;
  resetToSeed(): Result<void>;
  repository<K extends EntityKey>(key: K): Repository<EntityOf<K>>;
}

export function createDataStore(getStorage: () => Storage): DataStore {
  let current: Dataset | null = null;
  let loadWarning: AppError | null = null;
  const indexes = new Map<EntityKey, Map<string, { id: string }>>();

  const dataset = (): Dataset => {
    if (!current) {
      const outcome = loadDataset(getStorage());
      current = outcome.dataset;
      loadWarning = outcome.warning;
    }
    return current;
  };

  const indexOf = (key: EntityKey): Map<string, { id: string }> => {
    let idx = indexes.get(key);
    if (!idx) {
      idx = new Map((dataset()[key] as { id: string }[]).map((r) => [r.id, r]));
      indexes.set(key, idx);
    }
    return idx;
  };

  const commit = (changes: Partial<Dataset>): Result<void> => {
    const next: Dataset = { ...dataset(), ...changes };
    // Validate before writing: a bad record persisted would force a seed reset on the next load
    const parsed = datasetSchema.safeParse(next);
    if (!parsed.success) {
      logger.error('dataStore.commitInvalid', { paths: parsed.error.issues.slice(0, 5).map((i) => i.path.join('.')) });
      return fail('VALIDATION');
    }
    const saved = saveDataset(getStorage(), next);
    if (!saved.ok) return saved;
    current = next;
    indexes.clear();
    return ok(undefined);
  };

  const repository = <K extends EntityKey>(key: K): Repository<EntityOf<K>> => {
    type T = EntityOf<K>;
    const all = () => dataset()[key] as T[];
    return {
      findAll: () => all(),
      findById: (id) => indexOf(key).get(id) as T | undefined,
      create: (item) => {
        if (indexOf(key).has(item.id)) return fail('VALIDATION', { id: 'รหัสซ้ำ' });
        return commit({ [key]: [...all(), item] } as Partial<Dataset>);
      },
      update: (id, patch) => {
        if (!indexOf(key).has(id)) return fail('NOT_FOUND');
        return commit({ [key]: all().map((r) => (r.id === id ? { ...r, ...patch, id } : r)) } as Partial<Dataset>);
      },
    };
  };

  return {
    getDataset: dataset,
    takeLoadWarning: () => {
      dataset();
      const w = loadWarning;
      loadWarning = null;
      return w;
    },
    commit,
    resetToSeed: () => {
      const seed = seedDataset();
      const saved = saveDataset(getStorage(), seed);
      if (!saved.ok) return saved;
      current = seed;
      indexes.clear();
      return ok(undefined);
    },
    repository,
  };
}

/** App-wide store on window.localStorage (lazy — nothing is read until first use). */
export const dataStore = createDataStore(() => window.localStorage);
