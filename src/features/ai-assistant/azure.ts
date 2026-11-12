/**
 * Azure AI Foundry adapter (integration.md Add-on 2026-11-13): POST /api/ai/assist → Vite middleware → Azure.
 * The browser sends only { text, page, history } (FR-114: history = prior panel turns, no name / email / phone). Any HTTP error, timeout or bad shape throws → caller falls back.
 * An id / route that does not exist in this app, or a reply with no text, counts as bad output → fallback (never trust the model's ids blindly).
 */
import { z } from 'zod';
import type { Dataset } from '@/domain/types';
import type { AiAssistant, AiResult, AiTurn } from './assistant';
import { buildDraft, STATIC_ROUTES } from './ruleBased';

const CLIENT_TIMEOUT_MS = 10_000;

const assistOutputSchema = z.object({
  kind: z.enum(['draft', 'navigate', 'reply', 'unknown']),
  serviceDefinitionId: z.string().nullable(),
  route: z.string().nullable(),
  summary: z.string().nullable(),
  reply: z.string().nullable(),
});

export class AzureAssistant implements AiAssistant {
  constructor(private readonly dataset: Pick<Dataset, 'serviceDefinitions' | 'templates'>) {}

  async suggest(text: string, pageName: string, history: AiTurn[] = []): Promise<AiResult> {
    const input = text.trim();
    const res = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, page: pageName, history }),
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error('upstream');
    const parsed = assistOutputSchema.safeParse(await res.json().catch(() => null));
    if (!parsed.success) throw new Error('bad_output');
    const out = parsed.data;

    if (out.kind === 'draft') {
      const definition = this.dataset.serviceDefinitions.find((s) => s.id === out.serviceDefinitionId);
      if (!definition) throw new Error('bad_output');
      return { kind: 'draft', draft: buildDraft(this.dataset.templates, definition, input, out.summary || input) };
    }
    if (out.kind === 'navigate') {
      if (!out.route || !STATIC_ROUTES.has(out.route)) throw new Error('bad_output');
      return { kind: 'navigate', route: out.route };
    }
    if (out.kind === 'reply') {
      const reply = out.reply?.trim();
      if (!reply) throw new Error('bad_output');
      return { kind: 'reply', text: reply };
    }
    return { kind: 'unknown' };
  }
}
