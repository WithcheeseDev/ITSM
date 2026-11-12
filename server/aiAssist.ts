/**
 * AI Assist middleware (integration.md Add-ons 2026-11-13): browser → POST /api/ai/assist { text, page, history? }
 * history = up to 6 earlier turns { user, assistant } sent by the browser each request; the agent reads them only via
 * the per-request recallConversation tool. The server never stores or logs them (stateless memory).
 * → AI SDK ToolLoopAgent (server/ai/agent.ts) on the model from AI_PROVIDER, streamed as NDJSON (200):
 * {type:'delta',text} while the partial output is a reply, then one {type:'done',result:{ kind, serviceDefinitionId, route,
 * summary, reply }} or {type:'error',error:'upstream'|'timeout'}. 405/400/500 stay plain JSON { error } before the agent starts.
 * Runs in `vite dev` and `vite preview` only; keys never leave Node.
 * Never returns or logs upstream bodies, keys, the user's text or model output.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { assistOutputSchema, createAssistAgent } from './ai/agent';
import { resolveModel, type AiEnv } from './ai/model';
import { NAVIGABLE_ROUTES } from './ai/pages';
import type { ConversationTurn } from './ai/tools';

export { APP_STATIC_ROUTES } from './ai/tools';
export type { AiEnv } from './ai/model';

export const AI_ASSIST_PATH = '/api/ai/assist';
const MAX_BODY_BYTES = 32 * 1024;
const MAX_TEXT = 1000;
const MAX_PAGE = 60;
const MAX_TURNS = 6;
const MAX_TURN_TEXT = 500;
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

const turnText = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length >= 1 && t.length <= MAX_TURN_TEXT ? t : null;
};

/** Missing → []; anything else must be ≤ 6 objects with exactly { user, assistant }, each 1–500 chars trimmed. */
function parseHistory(v: unknown): ConversationTurn[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > MAX_TURNS) return null;
  const turns: ConversationTurn[] = [];
  for (const item of v) {
    if (!isRecord(item) || Array.isArray(item) || Object.keys(item).length !== 2) return null;
    const user = turnText(item.user);
    const assistant = turnText(item.assistant);
    if (user === null || assistant === null) return null;
    turns.push({ user, assistant });
  }
  return turns;
}

function parseRequest(raw: string): { text: string; page: string; history: ConversationTurn[] } | null {
  try {
    const body: unknown = JSON.parse(raw);
    if (!isRecord(body) || typeof body.text !== 'string' || typeof body.page !== 'string') return null;
    const text = body.text.trim();
    if (text.length < 1 || text.length > MAX_TEXT || body.page.length > MAX_PAGE) return null;
    const history = parseHistory(body.history);
    if (!history) return null;
    return { text, page: body.page, history };
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
  const timeout = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
  const client = new AbortController();
  res.on('close', () => {
    if (!res.writableFinished) client.abort();
  });
  const signal = AbortSignal.any([timeout, client.signal]);

  // NDJSON from here on: status 200, then delta lines and exactly one terminal line (done | error)
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  const line = (body: unknown) => {
    if (!res.destroyed && !res.writableEnded) res.write(`${JSON.stringify(body)}\n`);
  };
  const finish = (body: unknown) => {
    line(body);
    res.end();
  };
  /** The log keeps today's 502/504 codes so log readers see the same lines; the client gets an error line. */
  const streamFail = (status: number, error: 'upstream' | 'timeout', meta: Record<string, unknown>) => {
    console.warn('[ai-assist]', status, error, meta);
    finish({ type: 'error', error });
  };

  try {
    const result = await createAssistAgent(model, input.history).stream({ prompt: input.text, abortSignal: signal });
    let sent = '';
    for await (const partial of result.partialOutputStream) {
      // trimmed like the done reply, so the deltas always add up to a prefix of it (and blank replies stream nothing)
      const partialReply = partial?.kind === 'reply' && typeof partial.reply === 'string' ? partial.reply.trim() : undefined;
      // only a pure extension of what was sent; anything else (rewritten text, past the cap) sends nothing
      if (partialReply === undefined || sent.length >= MAX_REPLY || !partialReply.startsWith(sent)) continue;
      const text = partialReply.slice(sent.length, MAX_REPLY);
      if (!text) continue;
      sent += text;
      line({ type: 'delta', text });
    }
    const output = await result.output;
    const steps = (await result.steps).length;
    const parsed = assistOutputSchema.safeParse(output);
    if (!parsed.success) return streamFail(502, 'upstream', { provider, steps });
    // fixed code only: the route text is model output and may echo the user's words
    if (parsed.data.kind === 'navigate' && !NAVIGABLE_ROUTES.has(parsed.data.route ?? ''))
      return streamFail(502, 'upstream', { provider, steps, reason: 'route_not_allowed' });
    const reply = parsed.data.kind === 'reply' ? (parsed.data.reply ?? '').trim().slice(0, MAX_REPLY) : null;
    if (parsed.data.kind === 'reply' && !reply) return streamFail(502, 'upstream', { provider, steps, reason: 'empty_reply' });
    console.warn('[ai-assist]', 200, { provider, steps, turns: input.history.length });
    finish({ type: 'done', result: { ...parsed.data, reply } });
  } catch (err) {
    // client went away: nobody to answer, not a timeout
    if (client.signal.aborted) return void res.end();
    if (timeout.aborted) return streamFail(504, 'timeout', { provider });
    return streamFail(502, 'upstream', { provider, ...errorMeta(err) });
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
