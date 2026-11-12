/** AI Assist agent (integration.md Add-on 2026-11-13): ToolLoopAgent + structured output, at most 4 steps. */
import { isStepCount, Output, ToolLoopAgent, type LanguageModel } from 'ai';
import { z } from 'zod';
import { ALLOWED_ROUTES, assistTools } from './tools';

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
  '- If the user describes a problem or asks for a service: call searchServices first (short keywords, Thai or English), then kind = "draft", serviceDefinitionId = an id returned by searchServices, summary = a short summary of the request (at most 200 characters, same language as the user), route = null. Never use an id that searchServices did not return.',
  '- Catalog names are mostly English (e.g. "Mouse", "Keyboard"): if searchServices returns nothing, search again with the English word.',
  '- If the user wants to go to a page: kind = "navigate", route = exactly one allowed route, serviceDefinitionId = null, summary = null.',
  '- Otherwise (including no matching service): kind = "unknown" and every other field null.',
  '- Never include personal data (names, emails, phone numbers) in the summary.',
  `Allowed routes (also from listRoutes): ${ALLOWED_ROUTES.map((r) => `${r.route} (${r.hints.join(', ')})`).join('; ')}`,
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
