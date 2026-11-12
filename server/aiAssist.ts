/**
 * AI Assist middleware (integration.md Add-on 2026-11-13): browser → POST /api/ai/assist { text, page }
 * → Azure AI Foundry Responses API → { kind, serviceDefinitionId, route, summary }.
 * Runs in `vite dev` and `vite preview` only; the api key never leaves Node.
 * Never returns or logs the upstream body, the key or the user's text.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import seed from '../src/data/database.json';

export const AI_ASSIST_PATH = '/api/ai/assist';
const MAX_BODY_BYTES = 8 * 1024;
const MAX_TEXT = 1000;
const MAX_PAGE = 60;
const UPSTREAM_TIMEOUT_MS = 9000;

// shortcut: static (non-param) paths of ROUTES in src/app/routes.tsx — that file imports lucide-react, so it is not
// loaded into the Vite config; keep this list in sync (tests/unit/ai/aiAssistServer.test.ts asserts it).
export const APP_STATIC_ROUTES: readonly string[] = ['/login', '/my-space', '/catalog', '/calls/new', '/calls/search', '/approvals'];

const KINDS = ['draft', 'navigate', 'unknown'] as const;

export interface AssistOutput {
  kind: (typeof KINDS)[number];
  serviceDefinitionId: string | null;
  route: string | null;
  summary: string | null;
}

interface PromptDataset {
  serviceDefinitions: readonly { id: string; name: string; description: string }[];
  ai: { fallbackIntentToRoute: readonly { keywords: readonly string[]; route: string }[] };
}

export interface AiEnv {
  AZURE_AI_ENDPOINT?: string;
  AZURE_AI_DEPLOYMENT?: string;
  AZURE_AI_KEY?: string;
}

const nullableString = { type: ['string', 'null'] };
export const ASSIST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['kind', 'serviceDefinitionId', 'route', 'summary'],
  properties: {
    kind: { type: 'string', enum: KINDS },
    serviceDefinitionId: nullableString,
    route: nullableString,
    summary: nullableString,
  },
};

export function buildInstructions(dataset: PromptDataset): string {
  const services = dataset.serviceDefinitions.map((s) => `${s.id} | ${s.name} | ${s.description}`).join('\n');
  const routes = dataset.ai.fallbackIntentToRoute
    .filter((r) => APP_STATIC_ROUTES.includes(r.route))
    .map((r) => `${r.route} | hints: ${r.keywords.join(', ')}`)
    .join('\n');
  return [
    'You are the IT service desk assistant of an internal support portal. Users usually write in Thai.',
    'Decide what the user wants and answer only with the JSON object required by the schema.',
    '',
    'Service definitions (id | name | description):',
    services,
    '',
    'Allowed routes (route | keyword hints):',
    routes,
    '',
    'Rules:',
    '- If the user describes a problem or asks for a service: kind = "draft", serviceDefinitionId = the best matching id from the list, summary = a short summary of the request (at most 200 characters, same language as the user), route = null.',
    '- If the user wants to go to a page: kind = "navigate", route = exactly one allowed route, serviceDefinitionId = null, summary = null.',
    '- Otherwise: kind = "unknown" and every other field null.',
    '- Never invent an id or a route that is not listed above.',
    '- Never include personal data (names, emails, phone numbers) in the summary.',
  ].join('\n');
}

export function buildAzureBody(deployment: string, instructions: string, text: string) {
  return {
    model: deployment,
    instructions,
    input: text,
    text: { format: { type: 'json_schema', name: 'ai_assist', strict: true, schema: ASSIST_SCHEMA } },
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Text of the first `message` item's `output_text` part — not output[0]: reasoning models put a `reasoning` item first. */
export function extractOutputText(json: unknown): string | null {
  if (!isRecord(json) || !Array.isArray(json.output)) return null;
  const message: unknown = json.output.find((o) => isRecord(o) && o.type === 'message');
  if (!isRecord(message) || !Array.isArray(message.content)) return null;
  const part: unknown = message.content.find((c) => isRecord(c) && c.type === 'output_text');
  return isRecord(part) && typeof part.text === 'string' ? part.text : null;
}

export function parseAssistOutput(text: string): AssistOutput | null {
  let o: unknown;
  try {
    o = JSON.parse(text);
  } catch {
    return null;
  }
  const ns = (v: unknown): v is string | null => v === null || typeof v === 'string';
  if (!isRecord(o) || !KINDS.includes(o.kind as AssistOutput['kind'])) return null;
  if (!ns(o.serviceDefinitionId) || !ns(o.route) || !ns(o.summary)) return null;
  return { kind: o.kind as AssistOutput['kind'], serviceDefinitionId: o.serviceDefinitionId, route: o.route, summary: o.summary };
}

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

function fail(res: ServerResponse, status: number, error: string): void {
  console.warn('[ai-assist]', status, error);
  send(res, status, { error });
}

export async function handleAssist(req: IncomingMessage, res: ServerResponse, env: AiEnv): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'method_not_allowed');
  }
  const raw = await readBody(req).catch(() => null);
  const input = raw === null ? null : parseRequest(raw);
  if (!input) return fail(res, 400, 'bad_request');

  const { AZURE_AI_ENDPOINT: endpoint, AZURE_AI_DEPLOYMENT: deployment, AZURE_AI_KEY: key } = env;
  if (!endpoint || !deployment || !key) return fail(res, 500, 'config_missing');

  try {
    const upstream = await fetch(`${endpoint.replace(/\/+$/, '')}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': key },
      body: JSON.stringify(buildAzureBody(deployment, buildInstructions(seed), input.text)),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!upstream.ok) {
      console.warn('[ai-assist] upstream status', upstream.status);
      return fail(res, 502, 'upstream');
    }
    const text = extractOutputText(await upstream.json());
    const output = text === null ? null : parseAssistOutput(text);
    if (!output) return fail(res, 502, 'upstream');
    send(res, 200, output);
  } catch (err) {
    if ((err as { name?: unknown } | null)?.name === 'TimeoutError') return fail(res, 504, 'timeout');
    return fail(res, 502, 'upstream');
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
