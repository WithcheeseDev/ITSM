import type { CallHistory, SupportCall } from '@/domain/types';
import rawSeed from './database.json';

export const SCHEMA_VERSION = 1;

/** Latest `→ Resolved` history entry of a call, or null (data-model: resolvedAt derived when missing). */
export function deriveResolvedAt(callId: string, history: readonly CallHistory[]): string | null {
  let latest: string | null = null;
  for (const h of history) {
    if (h.callId === callId && h.toStatus === 'Resolved' && (latest === null || Date.parse(h.at) > Date.parse(latest))) {
      latest = h.at;
    }
  }
  return latest;
}

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  pdf: 'application/pdf', txt: 'text/plain', csv: 'text/csv',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Seed attachments use `{ id, fileName, sizeKb }`; the model is `{ name, size (bytes), type }` (Add-on 2026-11-12).
 * Already-shaped records pass through unchanged.
 */
export function normalizeAttachments(list: unknown): unknown {
  if (!Array.isArray(list)) return list;
  return list.map((a: Record<string, unknown>) => {
    if (a === null || typeof a !== 'object' || typeof a.fileName !== 'string') return a;
    const ext = a.fileName.split('.').pop()?.toLowerCase() ?? '';
    return {
      name: a.fileName,
      size: typeof a.sizeKb === 'number' ? Math.round(a.sizeKb * 1024) : 0,
      type: MIME_BY_EXT[ext] ?? 'application/octet-stream',
    };
  });
}

/** Adds fields newer than the stored shape: schemaVersion, SupportCall.resolvedAt, attachment shape. Input is not mutated. */
export function normalizeDataset(input: Record<string, unknown>): Record<string, unknown> {
  const history = (Array.isArray(input.callHistory) ? input.callHistory : []) as CallHistory[];
  const calls = Array.isArray(input.supportCalls) ? (input.supportCalls as Partial<SupportCall>[]) : input.supportCalls;
  return {
    ...input,
    schemaVersion: input.schemaVersion ?? SCHEMA_VERSION,
    supportCalls: Array.isArray(calls)
      ? calls.map((c) => ({
          ...c,
          attachments: normalizeAttachments(c.attachments) as SupportCall['attachments'],
          ...(c.resolvedAt === undefined && typeof c.id === 'string' ? { resolvedAt: deriveResolvedAt(c.id, history) } : {}),
        }))
      : calls,
    activities: Array.isArray(input.activities)
      ? (input.activities as Record<string, unknown>[]).map((a) => ({ ...a, attachments: normalizeAttachments(a.attachments) }))
      : input.activities,
  };
}

/** Fresh deep copy of the seed (database.json) in the current shape — not yet validated. */
export function rawSeedDataset(): Record<string, unknown> {
  return normalizeDataset(structuredClone(rawSeed) as Record<string, unknown>);
}
