/** Read-only agent tools over the seed (integration.md Add-on 2026-11-13). No approval needed. */
import { tool } from 'ai';
import { z } from 'zod';
import seed from '../../src/data/database.json';

// shortcut: static (non-param) paths of ROUTES in src/app/routes.tsx — that file imports lucide-react, so it is not
// loaded into the Vite config; keep this list in sync (tests/unit/ai/azure.test.ts asserts it).
export const APP_STATIC_ROUTES: readonly string[] = ['/login', '/my-space', '/catalog', '/calls/new', '/calls/search', '/approvals'];

const MAX_RESULTS = 10;

export interface ServiceHit {
  id: string;
  name: string;
  description: string;
}

// Thai/English keywords from the rule-based fallback, so a Thai query ("เมาส์") still reaches English catalog names
const KEYWORDS = new Map<string, string>();
for (const r of seed.ai.fallbackKeywordToServiceDefinition)
  KEYWORDS.set(r.serviceDefinitionId, `${KEYWORDS.get(r.serviceDefinitionId) ?? ''} ${r.keywords.join(' ')}`);

/** Services matching any whitespace token (case-insensitive) in name + description + fallback keywords, most matched tokens first. */
export function findServices(query: string): ServiceHit[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return seed.serviceDefinitions
    .map((s) => {
      const hay = `${s.name} ${s.description} ${KEYWORDS.get(s.id) ?? ''}`.toLowerCase();
      return { s, score: tokens.filter((t) => hay.includes(t)).length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(({ s }) => ({ id: s.id, name: s.name, description: s.description }));
}

export const ALLOWED_ROUTES: readonly { route: string; hints: readonly string[] }[] = seed.ai.fallbackIntentToRoute
  .filter((r) => APP_STATIC_ROUTES.includes(r.route))
  .map((r) => ({ route: r.route, hints: r.keywords }));

export const assistTools = {
  searchServices: tool({
    description: 'Search the service catalog. Returns up to 10 services { id, name, description }. Use short keywords (Thai or English).',
    inputSchema: z.object({ query: z.string().min(1).max(100) }),
    execute: async ({ query }) => findServices(query),
  }),
  listRoutes: tool({
    description: 'List the pages the user may be sent to, with keyword hints.',
    inputSchema: z.object({}),
    execute: async () => ALLOWED_ROUTES,
  }),
};
