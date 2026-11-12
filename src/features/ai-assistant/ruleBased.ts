/**
 * Rule-based assistant (integration.md): keyword → service definition (draft), else keyword → route.
 * Case-insensitive substring; several matches → the first rule in data order.
 * A route that is not a real page in this app (e.g. /answers — Knowledge is Nice) → unknown.
 */
import { ROUTES } from '@/app/routes';
import type { Dataset, ServiceDefinition } from '@/domain/types';
import { MAX_SUMMARY } from '@/features/calls/callService';
import type { AiAssistant, AiDraft, AiResult } from './assistant';

/** Real pages an assistant may navigate to (shared with the Azure adapter). */
export const STATIC_ROUTES: ReadonlySet<string> = new Set(Object.values(ROUTES).map((r) => r.path).filter((p) => !p.includes(':')));

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Draft for a service definition: template defaults for urgency/impact (never chosen by the AI), user text as notes. */
export function buildDraft(
  templates: Dataset['templates'],
  definition: ServiceDefinition,
  input: string,
  summary: string = input,
): AiDraft {
  const template = templates.find((t) => t.id === definition.templateId);
  return {
    serviceDefinitionId: definition.id,
    urgency: template?.defaultUrgency,
    impact: template?.defaultImpact,
    summary: summary.slice(0, MAX_SUMMARY),
    notes: `<p>${escapeHtml(input)}</p>`,
  };
}

export class RuleBasedAssistant implements AiAssistant {
  constructor(private readonly dataset: Pick<Dataset, 'ai' | 'serviceDefinitions' | 'templates'>) {}

  async suggest(text: string, _pageName: string): Promise<AiResult> {
    const input = text.trim();
    const lower = input.toLowerCase();
    if (!lower) return { kind: 'unknown' };
    const hit = (keywords: readonly string[]) => keywords.some((k) => lower.includes(k.toLowerCase()));

    const service = this.dataset.ai.fallbackKeywordToServiceDefinition.find((r) => hit(r.keywords));
    const definition = service && this.dataset.serviceDefinitions.find((s) => s.id === service.serviceDefinitionId);
    if (definition) return { kind: 'draft', draft: buildDraft(this.dataset.templates, definition, input) };

    const intent = this.dataset.ai.fallbackIntentToRoute.find((r) => hit(r.keywords));
    if (intent && STATIC_ROUTES.has(intent.route)) return { kind: 'navigate', route: intent.route };
    return { kind: 'unknown' };
  }
}
