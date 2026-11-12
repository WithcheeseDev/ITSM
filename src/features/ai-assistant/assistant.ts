/**
 * C15 AI Assistant — one interface, swappable implementations (US-032–034).
 * Only the typed text, current page name and prior turns of this panel conversation are passed to an implementation
 * (FR-114: no name / email / phone).
 * The assistant never creates a ticket: a draft only pre-fills the form, the user presses OK.
 */
import { ROUTES } from '@/app/routes';
import { dataStore } from '@/data/repositories';
import { APP_ERROR_MESSAGES, type Dataset, type Impact, type Urgency } from '@/domain/types';
import { logger } from '@/shared/logger';
import { AzureAssistant } from './azure';
import { RuleBasedAssistant } from './ruleBased';

export interface AiDraft {
  serviceDefinitionId: string;
  urgency?: Urgency;
  impact?: Impact;
  summary?: string;
  notes?: string;
}

export type AiResult =
  | { kind: 'draft'; draft: AiDraft }
  | { kind: 'navigate'; route: string; filters?: Record<string, string> }
  | { kind: 'reply'; text: string }
  | { kind: 'unknown' };

/** One prior exchange of the panel conversation sent for follow-ups (server contract: ≤ 6 turns, each side 1–500 chars). */
export interface AiTurn {
  user: string;
  assistant: string;
}

export const MAX_HISTORY_TURNS = 6;
export const MAX_TURN_CHARS = 500;

export interface AiAssistant {
  suggest(text: string, pageName: string, history: AiTurn[]): Promise<AiResult>;
}

function describeResult(r: AiResult, dataset: Pick<Dataset, 'serviceDefinitions'>): string {
  if (r.kind === 'draft') {
    const id = r.draft.serviceDefinitionId;
    const name = dataset.serviceDefinitions.find((s) => s.id === id)?.name ?? id;
    const summary = r.draft.summary?.trim();
    return `ร่างเรื่อง: ${name} (${id})${summary ? ` — ${summary}` : ''}`;
  }
  if (r.kind === 'navigate') {
    const title = Object.values(ROUTES).find((x) => x.path === r.route)?.title;
    return title ? `พาไปหน้า ${title} (${r.route})` : `พาไปหน้า ${r.route}`;
  }
  if (r.kind === 'reply') return r.text;
  return 'ไม่เข้าใจคำขอ';
}

const clip = (s: string) => s.trim().slice(0, MAX_TURN_CHARS).trim();

/** Answered turns only (pending skipped), last MAX_HISTORY_TURNS, oldest → newest, clipped to the server limits. */
export function buildHistory(
  turns: ReadonlyArray<{ text: string; result: AiResult | null }>,
  dataset: Pick<Dataset, 'serviceDefinitions'>,
): AiTurn[] {
  return turns
    .filter((t): t is { text: string; result: AiResult } => t.result !== null)
    .slice(-MAX_HISTORY_TURNS)
    .map((t) => ({ user: clip(t.text), assistant: clip(describeResult(t.result, dataset)) }))
    .filter((t) => t.user && t.assistant);
}

export interface AiAnswer {
  result: AiResult;
  /** shown as a warning banner when the configured AI was not used */
  notice: string | null;
}

/**
 * VITE_AI_MODE: "mock" (default) = rule-based · "azure" = Azure AI Foundry via the /api/ai/assist middleware.
 * Azure failure (HTTP error, timeout, network, bad shape) → rule-based result + AI_UNAVAILABLE notice (US-034).
 */
export const AI_MODE: string = import.meta.env.VITE_AI_MODE ?? 'mock';

/** Fixed code for the log — never the error message (could echo upstream content). */
function fallbackReason(err: unknown): string {
  // name check, not instanceof Error: DOMException is not an Error subclass in every runtime
  const { name, message } = (err ?? {}) as { name?: unknown; message?: unknown };
  if (name === 'TimeoutError' || name === 'AbortError') return 'timeout';
  return message === 'upstream' || message === 'bad_output' ? message : 'network';
}

export async function askAssistant(text: string, pageName: string, history: AiTurn[] = []): Promise<AiAnswer> {
  const dataset = dataStore.getDataset();
  if (AI_MODE === 'azure') {
    try {
      return { result: await new AzureAssistant(dataset).suggest(text, pageName, history), notice: null };
    } catch (err) {
      logger.warn('ai.fallback', { reason: fallbackReason(err), pageName });
      return { result: await new RuleBasedAssistant(dataset).suggest(text, pageName, history), notice: APP_ERROR_MESSAGES.AI_UNAVAILABLE };
    }
  }
  return { result: await new RuleBasedAssistant(dataset).suggest(text, pageName, history), notice: null };
}
