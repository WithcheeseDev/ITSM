import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_ERROR_MESSAGES } from '@/domain/types';
import { STATIC_ROUTES } from '@/features/ai-assistant/ruleBased';
import { APP_STATIC_ROUTES } from '../../../server/aiAssist';

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
const out = (o: Partial<Record<'kind' | 'serviceDefinitionId' | 'route' | 'summary', string | null>>) =>
  ok({ kind: 'unknown', serviceDefinitionId: null, route: null, summary: null, ...o });

async function ask(text = 'เมาส์เสีย คลิกไม่ติด') {
  const { askAssistant } = await import('@/features/ai-assistant/assistant');
  return askAssistant(text, 'My Space');
}

describe('AzureAssistant via askAssistant (VITE_AI_MODE=azure)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_AI_MODE', 'azure');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends only text + page and maps a valid draft with template defaults', async () => {
    vi.mocked(fetch).mockResolvedValue(out({ kind: 'draft', serviceDefinitionId: 'sdf_002', summary: 'Mouse ใช้งานไม่ได้' }));
    const answer = await ask(' เมาส์ <b>เสีย</b> ');
    expect(answer).toEqual({
      notice: null,
      result: {
        kind: 'draft',
        draft: {
          serviceDefinitionId: 'sdf_002', urgency: '3-Medium', impact: '4-Minor/Localized',
          summary: 'Mouse ใช้งานไม่ได้', notes: '<p>เมาส์ &#60;b&#62;เสีย&#60;/b&#62;</p>',
        },
      },
    });
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe('/api/ai/assist');
    expect(JSON.parse(init!.body as string)).toEqual({ text: 'เมาส์ <b>เสีย</b>', page: 'My Space' });
  });

  it('uses the user text as summary when the model gives none', async () => {
    vi.mocked(fetch).mockResolvedValue(out({ kind: 'draft', serviceDefinitionId: 'sdf_002' }));
    const { result } = await ask('เมาส์เสีย');
    expect(result.kind === 'draft' && result.draft.summary).toBe('เมาส์เสีย');
  });

  it('an id that does not exist → rule-based fallback + notice (integration.md Fallback)', async () => {
    vi.mocked(fetch).mockResolvedValue(out({ kind: 'draft', serviceDefinitionId: 'sdf_999', summary: 'x' }));
    expect(await ask('เมาส์เสีย')).toEqual({ result: expect.objectContaining({ kind: 'draft' }), notice: APP_ERROR_MESSAGES.AI_UNAVAILABLE });
  });

  it('model answers unknown → unknown without notice', async () => {
    vi.mocked(fetch).mockResolvedValue(out({}));
    expect(await ask('สวัสดี')).toEqual({ result: { kind: 'unknown' }, notice: null });
  });

  it('navigate only to a real page', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(out({ kind: 'navigate', route: '/calls/search' }));
    expect(await ask('ค้นหา')).toEqual({ result: { kind: 'navigate', route: '/calls/search' }, notice: null });
    vi.mocked(fetch).mockResolvedValueOnce(out({ kind: 'navigate', route: '/answers' }));
    expect((await ask('คู่มือ')).notice).toBe(APP_ERROR_MESSAGES.AI_UNAVAILABLE);
    vi.mocked(fetch).mockResolvedValueOnce(out({ kind: 'navigate', route: '/calls/:callId' }));
    expect((await ask('x')).notice).toBe(APP_ERROR_MESSAGES.AI_UNAVAILABLE);
  });

  it.each([
    ['502 response', () => vi.mocked(fetch).mockResolvedValue(new Response('{"error":"upstream"}', { status: 502 })), 'upstream'],
    ['network error', () => vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch')), 'network'],
    ['abort / timeout', () => vi.mocked(fetch).mockRejectedValue(new DOMException('t', 'TimeoutError')), 'timeout'],
    ['malformed shape', () => vi.mocked(fetch).mockResolvedValue(ok({ kind: 'draft', serviceDefinitionId: 1 })), 'bad_output'],
    ['non-JSON body', () => vi.mocked(fetch).mockResolvedValue(new Response('<html>', { status: 200 })), 'bad_output'],
  ])('%s → rule-based result + AI_UNAVAILABLE, logs a fixed reason and no user text', async (_n, arrange, reason) => {
    arrange();
    const answer = await ask('เมาส์เสีย โทร 0811111111');
    expect(answer).toEqual({ result: expect.objectContaining({ kind: 'draft' }), notice: APP_ERROR_MESSAGES.AI_UNAVAILABLE });
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain('ai.fallback');
    expect(logged).toContain(reason);
    expect(logged).not.toContain('0811111111');
  });
});

it('server route list stays in sync with the app route table', () => {
  expect([...APP_STATIC_ROUTES].sort()).toEqual([...STATIC_ROUTES].sort());
});
