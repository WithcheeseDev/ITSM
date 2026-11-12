/** AI Assist agent (integration.md Add-on 2026-11-13): ToolLoopAgent + structured output, at most 4 steps. */
import { isStepCount, Output, ToolLoopAgent, type LanguageModel } from 'ai';
import { z } from 'zod';
import { assistTools } from './tools';

// .nullable() not .optional(): strict JSON-schema mode needs every key required
export const assistOutputSchema = z.object({
  kind: z.enum(['draft', 'navigate', 'unknown']),
  serviceDefinitionId: z.string().nullable(),
  route: z.string().nullable(),
  summary: z.string().nullable(),
});
export type AssistOutput = z.infer<typeof assistOutputSchema>;

export const ASSIST_INSTRUCTIONS = [
  'You are the IT service desk assistant of an internal support portal. Users usually write in Thai.',
  'Rules:',
  '- If the user asks what services exist or wants to browse the catalog (no concrete problem or specific service named): this is navigation, not a draft — use searchPages.',
  '- If the user describes a concrete problem or asks for a specific service: call searchServices first (short keywords, Thai or English), then kind = "draft", serviceDefinitionId = an id returned by searchServices, summary = a short summary of the request (at most 200 characters, same language as the user), route = null. Never use an id that searchServices did not return.',
  '- Catalog names are mostly English (e.g. "Mouse", "Keyboard"): if searchServices returns nothing, search again with the English word.',
  '- If the user wants to go to a page or asks how/where to do something: call searchPages first, then kind = "navigate", route = exactly one route that searchPages returned, serviceDefinitionId = null, summary = null. Never navigate to a route searchPages did not return. Use the route exactly as returned, without filling in params (e.g. /catalog, not /catalog/cat_002).',
  '- Never navigate to /calls/new: a new call always starts from searchServices and kind = "draft".',
  '- Otherwise (including no matching service): kind = "unknown" and every other field null.',
  '- Never include personal data (names, emails, phone numbers) in the summary.',
].join('\n');

export function createAssistAgent(model: LanguageModel) {
  return new ToolLoopAgent({
    model,
    instructions: ASSIST_INSTRUCTIONS,
    tools: assistTools,
    output: Output.object({ schema: assistOutputSchema }),
    stopWhen: isStepCount(4),
  });
}
