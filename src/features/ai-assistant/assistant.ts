/**
 * C15 AI Assistant — one interface, swappable implementations (US-032–034).
 * Only the typed text + current page name are passed to an implementation (FR-114: no name / email / phone).
 * The assistant never creates a ticket: a draft only pre-fills the form, the user presses OK.
 */
import { dataStore } from '@/data/repositories';
import { APP_ERROR_MESSAGES, type Impact, type Urgency } from '@/domain/types';
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
  | { kind: 'unknown' };

export interface AiAssistant {
  suggest(text: string, pageName: string): Promise<AiResult>;
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

export async function askAssistant(text: string, pageName: string): Promise<AiAnswer> {
  const dataset = dataStore.getDataset();
  if (AI_MODE === 'azure') {
    try {
      return { result: await new AzureAssistant(dataset).suggest(text, pageName), notice: null };
    } catch (err) {
      logger.warn('ai.fallback', { reason: fallbackReason(err), pageName });
      return { result: await new RuleBasedAssistant(dataset).suggest(text, pageName), notice: APP_ERROR_MESSAGES.AI_UNAVAILABLE };
    }
  }
  return { result: await new RuleBasedAssistant(dataset).suggest(text, pageName), notice: null };
}
