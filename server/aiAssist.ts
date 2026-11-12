/**
 * AI Assist middleware (integration.md Add-ons 2026-11-13): browser → POST /api/ai/assist { text, page }
 * → AI SDK ToolLoopAgent (server/ai/agent.ts) on the model from AI_PROVIDER → { kind, serviceDefinitionId, route, summary, reply }.
 * Runs in `vite dev` and `vite preview` only; keys never leave Node.
 * Never returns or logs upstream bodies, keys, the user's text or model output.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { assistOutputSchema, createAssistAgent } from './ai/agent';
import { resolveModel, type AiEnv } from './ai/model';
import { NAVIGABLE_ROUTES } from './ai/pages';

export { APP_STATIC_ROUTES } from './ai/tools';
export type { AiEnv } from './ai/model';

export const AI_ASSIST_PATH = '/api/ai/assist';
const MAX_BODY_BYTES = 8 * 1024;
const MAX_TEXT = 1000;
const MAX_PAGE = 60;
const UPSTREAM_TIMEOUT_MS = 9000;
const MAX_REPLY = 1000;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Resolves null once the body passes the cap (the rest is drained and dropped). */
function readBody(req: IncomingMessage): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) resolve(null);
      else chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseRequest(raw: string): { text: string; page: string } | null {
  try {
    const body: unknown = JSON.parse(raw);
    if (!isRecord(body) || typeof body.text !== 'string' || typeof body.page !== 'string') return null;
    const text = body.text.trim();
    if (text.length < 1 || text.length > MAX_TEXT || body.page.length > MAX_PAGE) return null;
    return { text, page: body.page };
  } catch {
    return null;
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/** Only safe metadata: never the error object/message (SDK errors can carry the request body or model text). */
function fail(res: ServerResponse, status: number, error: string, meta: Record<string, unknown> = {}): void {
  console.warn('[ai-assist]', status, error, meta);
  send(res, status, { error });
}

function errorMeta(err: unknown): Record<string, unknown> {
  const e = isRecord(err) ? err : {};
  return { name: typeof e.name === 'string' ? e.name : undefined, statusCode: typeof e.statusCode === 'number' ? e.statusCode : undefined };
}

export async function handleAssist(req: IncomingMessage, res: ServerResponse, env: AiEnv): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'method_not_allowed');
  }
  const raw = await readBody(req).catch(() => null);
  const input = raw === null ? null : parseRequest(raw);
  if (!input) return fail(res, 400, 'bad_request');

  let model;
  try {
    model = resolveModel(env);
  } catch (err) {
    // ConfigMissingError, or a malformed endpoint rejected by the provider factory
    return fail(res, 500, 'config_missing', errorMeta(err));
  }
  const provider = env.AI_PROVIDER;
  const signal = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
  try {
    const result = await createAssistAgent(model).generate({ prompt: input.text, abortSignal: signal });
    const parsed = assistOutputSchema.safeParse(result.output);
    if (!parsed.success) return fail(res, 502, 'upstream', { provider, steps: result.steps.length });
    // fixed code only: the route text is model output and may echo the user's words
    if (parsed.data.kind === 'navigate' && !NAVIGABLE_ROUTES.has(parsed.data.route ?? ''))
      return fail(res, 502, 'upstream', { provider, steps: result.steps.length, reason: 'route_not_allowed' });
    const reply = parsed.data.kind === 'reply' ? (parsed.data.reply ?? '').trim().slice(0, MAX_REPLY) : null;
    if (parsed.data.kind === 'reply' && !reply)
      return fail(res, 502, 'upstream', { provider, steps: result.steps.length, reason: 'empty_reply' });
    console.warn('[ai-assist]', 200, { provider, steps: result.steps.length });
    send(res, 200, { ...parsed.data, reply });
  } catch (err) {
    if (signal.aborted) return fail(res, 504, 'timeout', { provider });
    return fail(res, 502, 'upstream', { provider, ...errorMeta(err) });
  }
}

export function aiAssistPlugin(env: AiEnv): Plugin {
  const handler = (req: IncomingMessage, res: ServerResponse) => void handleAssist(req, res, env);
  return {
    name: 'itsm-ai-assist',
    configureServer(server) {
      server.middlewares.use(AI_ASSIST_PATH, handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(AI_ASSIST_PATH, handler);
    },
  };
}
