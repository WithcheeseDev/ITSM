import { useCallback, useState } from 'react';
import { CALL_COLUMNS, DEFAULT_COLUMN_IDS, REQUIRED_COLUMN_ID } from './callColumns';

const KNOWN = new Set(CALL_COLUMNS.map((c) => c.id));
export const columnsKey = (userId: string) => `itsm.columns.${userId}`;

/** Keep only known ids, in table order, always including Number (US-011). */
export function normalizeColumns(ids: readonly string[]): string[] {
  const wanted = new Set(ids.filter((id) => KNOWN.has(id)));
  wanted.add(REQUIRED_COLUMN_ID);
  return CALL_COLUMNS.map((c) => c.id).filter((id) => wanted.has(id));
}

function read(userId: string): string[] {
  try {
    const raw = localStorage.getItem(columnsKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) return normalizeColumns(parsed);
  } catch {
    // storage blocked or malformed → defaults
  }
  return normalizeColumns(DEFAULT_COLUMN_IDS);
}

/** Selected table columns, remembered per user in localStorage `itsm.columns.{userId}`. */
export function useColumnPrefs(userId: string): [string[], (ids: readonly string[]) => void] {
  const [state, setState] = useState(() => ({ userId, ids: read(userId) }));
  const ids = state.userId === userId ? state.ids : read(userId);

  const setIds = useCallback(
    (next: readonly string[]) => {
      const clean = normalizeColumns(next);
      setState({ userId, ids: clean });
      try {
        localStorage.setItem(columnsKey(userId), JSON.stringify(clean));
      } catch {
        // preference only — keep working in memory
      }
    },
    [userId],
  );
  return [ids, setIds];
}
