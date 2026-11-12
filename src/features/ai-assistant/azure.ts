/**
 * Azure AI Foundry adapter (integration.md Add-on 2026-11-13): POST /api/ai/assist → Vite middleware → Azure.
 * The browser sends only { text, page, history } (FR-114: history = prior panel turns, no name / email / phone). Any HTTP error, timeout or bad shape throws → caller falls back.
 * An id / route that does not exist in this app, or a reply with no text, counts as bad output → fallback (never trust the model's ids blindly).
 * 200 body is NDJSON: {"type":"delta","text"} lines (preview only, not validated) then one terminal line
 * {"type":"done","result"} (validated below) or {"type":"error"}. Missing / unknown / invalid line → bad_output.
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

const streamLineSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('delta'), text: z.string() }),
  z.object({ type: z.literal('done'), result: z.unknown() }),
  z.object({ type: z.literal('error'), error: z.string() }),
]);

/** Reads NDJSON lines until the terminal one; returns its `result` (unvalidated). The 10s fetch signal also bounds this read. */
async function readTerminal(body: ReadableStream<Uint8Array>, onDelta?: (soFar: string) => void): Promise<unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let soFar = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = done ? '' : (lines.pop() ?? ''); // at EOF the leftover is the last line (server may omit the final \n)
      for (const line of lines) {
        if (!line.trim()) continue;
        let json: unknown;
        try {
          json = JSON.parse(line);
        } catch {
          throw new Error('bad_output');
        }
        const parsed = streamLineSchema.safeParse(json);
        if (!parsed.success) throw new Error('bad_output');
        const msg = parsed.data;
        if (msg.type === 'error') throw new Error('upstream');
        if (msg.type === 'done') return msg.result;
        soFar += msg.text;
        onDelta?.(soFar);
      }
      if (done) throw new Error('bad_output');
    }
  } finally {
    reader.cancel().catch(() => {}); // cancelling an errored stream rejects
  }
}

export class AzureAssistant implements AiAssistant {
  constructor(private readonly dataset: Pick<Dataset, 'serviceDefinitions' | 'templates'>) {}

  async suggest(text: string, pageName: string, history: AiTurn[] = [], onDelta?: (soFar: string) => void): Promise<AiResult> {
    const input = text.trim();
    const res = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, page: pageName, history }),
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error('upstream');
    if (!res.body) throw new Error('bad_output');
    const parsed = assistOutputSchema.safeParse(await readTerminal(res.body, onDelta));
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
