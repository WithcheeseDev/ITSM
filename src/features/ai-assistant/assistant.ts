/**
 * C15 AI Assistant — one interface, swappable implementations (US-032–034).
 * Only the typed text + current page name are passed to an implementation (FR-114: no name / email / phone).
 * The assistant never creates a ticket: a draft only pre-fills the form, the user presses OK.
 */
import { dataStore } from '@/data/repositories';
import { APP_ERROR_MESSAGES, type Impact, type Urgency } from '@/domain/types';
import { logger } from '@/shared/logger';
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
  | { kind: 'unknown' };

export interface AiAssistant {
  suggest(text: string, pageName: string): Promise<AiResult>;
}

export interface AiAnswer {
  result: AiResult;
  /** shown as a warning banner when the configured AI was not used */
  notice: string | null;
}

/** VITE_AI_MODE: "mock" (default) = rule-based · "azure" = Azure agent (task 4.6, contract TBD). */
export const AI_MODE: string = import.meta.env.VITE_AI_MODE ?? 'mock';

export async function askAssistant(text: string, pageName: string): Promise<AiAnswer> {
  const ruleBased = new RuleBasedAssistant(dataStore.getDataset());
  if (AI_MODE === 'azure') {
    // shortcut: no Azure adapter until task 4.6 (contract TBD) — fall back to rule-based with the US-034 notice
    logger.warn('ai.fallback', { reason: 'azure_not_configured', pageName });
    return { result: await ruleBased.suggest(text, pageName), notice: APP_ERROR_MESSAGES.AI_UNAVAILABLE };
  }
  return { result: await ruleBased.suggest(text, pageName), notice: null };
}
