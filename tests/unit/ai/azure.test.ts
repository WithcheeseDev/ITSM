import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_ERROR_MESSAGES } from '@/domain/types';
import type { AiTurn } from '@/features/ai-assistant/assistant';
import { STATIC_ROUTES } from '@/features/ai-assistant/ruleBased';
import { APP_STATIC_ROUTES } from '../../../server/aiAssist';

const NDJSON = { 'Content-Type': 'application/x-ndjson' };
/** 200 NDJSON body whose only line is the terminal done line carrying `result`. */
const ok = (result: unknown) => new Response(`${JSON.stringify({ type: 'done', result })}\n`, { status: 200, headers: NDJSON });
/** 200 body streamed as the given byte chunks. */
const chunked = (chunks: Uint8Array[]) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(c) {
        chunks.forEach((x) => c.enqueue(x));
        c.close();
      },
    }),
    { status: 200, headers: NDJSON },
  );
const lines = (...objs: unknown[]) => objs.map((o) => `${JSON.stringify(o)}\n`).join('');
const out = (o: Partial<Record<'kind' | 'serviceDefinitionId' | 'route' | 'summary' | 'reply', string | null>>) =>
  ok({ kind: 'unknown', serviceDefinitionId: null, route: null, summary: null, reply: null, ...o });

async function ask(text = 'เมาส์เสีย คลิกไม่ติด', history: AiTurn[] = []) {
  const { askAssistant } = await import('@/features/ai-assistant/assistant');
  return askAssistant(text, 'My Space', history);
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

  it('sends only text + page + history and maps a valid draft with template defaults', async () => {
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
    expect(JSON.parse(init!.body as string)).toEqual({ text: 'เมาส์ <b>เสีย</b>', page: 'My Space', history: [] });
  });

  it('sends the panel history as passed', async () => {
    vi.mocked(fetch).mockResolvedValue(out({ kind: 'reply', reply: 'ได้ครับ' }));
    const history: AiTurn[] = [{ user: 'เมาส์เสีย', assistant: 'ร่างเรื่อง: Mouse - Incident (sdf_002)' }];
    await ask('ต้องทำอะไรต่อ', history);
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string)).toEqual({ text: 'ต้องทำอะไรต่อ', page: 'My Space', history });
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

  it('model replies → reply text without notice; reply kind with no text → fallback', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(out({ kind: 'reply', reply: ' สวัสดีครับ ' }));
    expect(await ask('สวัสดี')).toEqual({ result: { kind: 'reply', text: 'สวัสดีครับ' }, notice: null });
    vi.mocked(fetch).mockResolvedValueOnce(out({ kind: 'reply' }));
    expect((await ask('สวัสดี')).notice).toBe(APP_ERROR_MESSAGES.AI_UNAVAILABLE);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).toContain('bad_output');
  });

  it('streams NDJSON split inside a Thai character and mid-line: onDelta gets accumulated text, done reply → result', async () => {
    const body = new TextEncoder().encode(
      lines({ type: 'delta', text: 'สวัส' }, { type: 'delta', text: 'ดีครับ' }) +
        JSON.stringify({ type: 'done', result: { kind: 'reply', serviceDefinitionId: null, route: null, summary: null, reply: ' สวัสดีครับ ' } }) +
        `\n${JSON.stringify({ type: 'delta', text: 'ignored after done' })}\n`,
    );
    // '{"type":"delta","text":"' is 24 ASCII bytes, Thai chars are 3 bytes: cut 1 byte into the 2nd Thai char,
    // then mid second line (inside a Thai char too), then mid done line
    const cuts = [0, 24 + 4, 39 + 24 + 7, 120, body.length];
    vi.mocked(fetch).mockResolvedValue(chunked(cuts.slice(1).map((end, i) => body.slice(cuts[i], end))));
    const onDelta = vi.fn();
    const { askAssistant } = await import('@/features/ai-assistant/assistant');
    expect(await askAssistant('สวัสดี', 'My Space', [], onDelta)).toEqual({ result: { kind: 'reply', text: 'สวัสดีครับ' }, notice: null });
    expect(onDelta.mock.calls).toEqual([['สวัส'], ['สวัสดีครับ']]);
  });

  it('done draft after deltas goes through the existing mapping; a final line without \\n still counts', async () => {
    const result = { kind: 'draft', serviceDefinitionId: 'sdf_002', route: null, summary: 'Mouse ใช้งานไม่ได้', reply: null };
    vi.mocked(fetch).mockResolvedValue(chunked([new TextEncoder().encode(`${lines({ type: 'delta', text: 'x' })}${JSON.stringify({ type: 'done', result })}`)]));
    const { result: r } = await ask('เมาส์เสีย');
    expect(r).toEqual({ kind: 'draft', draft: expect.objectContaining({ serviceDefinitionId: 'sdf_002', summary: 'Mouse ใช้งานไม่ได้' }) });
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
    ['error line', () => vi.mocked(fetch).mockResolvedValue(new Response(lines({ type: 'delta', text: 'กำลัง' }, { type: 'error', error: 'timeout' }), { status: 200 })), 'upstream'],
    ['no terminal line', () => vi.mocked(fetch).mockResolvedValue(new Response(lines({ type: 'delta', text: 'สวัสดี' }), { status: 200 })), 'bad_output'],
    ['invalid line', () => vi.mocked(fetch).mockResolvedValue(new Response(`${lines({ type: 'delta', text: 'a' })}{oops\n`, { status: 200 })), 'bad_output'],
    ['unknown line type', () => vi.mocked(fetch).mockResolvedValue(new Response(lines({ type: 'ping' }), { status: 200 })), 'bad_output'],
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
