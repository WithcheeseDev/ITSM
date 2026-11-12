import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { MockLanguageModelV4 } from 'ai/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAssistAgent } from '../../../server/ai/agent';
import { ConfigMissingError, resolveModel, stallRetryFetch, type AiEnv } from '../../../server/ai/model';
import { findServices } from '../../../server/ai/tools';
import { handleAssist } from '../../../server/aiAssist';

// Partial mock: the real resolveModel runs unless a test overrides one call; ConfigMissingError stays the same class
vi.mock('../../../server/ai/model', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../server/ai/model')>();
  return { ...actual, resolveModel: vi.fn(actual.resolveModel) };
});

const VALID = { kind: 'draft', serviceDefinitionId: 'sdf_002', route: null, summary: 'Mouse เสีย', reply: null } as const;
const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};
const toolCallStep = (query: string, toolName = 'searchServices') => ({
  content: [{ type: 'tool-call' as const, toolCallId: 'c1', toolName, input: JSON.stringify({ query }) }],
  finishReason: { unified: 'tool-calls' as const, raw: undefined },
  usage,
  warnings: [],
});
const textStep = (text: string) => ({
  content: [{ type: 'text' as const, text }],
  finishReason: { unified: 'stop' as const, raw: undefined },
  usage,
  warnings: [],
});
const mockModel = (...steps: ReturnType<typeof textStep | typeof toolCallStep>[]) => new MockLanguageModelV4({ doGenerate: steps });

const AZURE: AiEnv = { AI_PROVIDER: 'azure', AI_MODEL: 'dep', AZURE_AI_ENDPOINT: 'https://r.services.ai.azure.com/openai/v1/', AZURE_AI_KEY: 'k-123' };
const BEDROCK: AiEnv = { AI_PROVIDER: 'bedrock', AI_MODEL: 'anthropic.x', AWS_REGION: 'ap-southeast-1', AWS_ACCESS_KEY_ID: 'AKIA', AWS_SECRET_ACCESS_KEY: 's-456' };

describe('resolveModel', () => {
  it('builds an azure responses model and a bedrock model without network', () => {
    const azure = resolveModel(AZURE);
    expect(typeof azure).toBe('object');
    expect(azure).toMatchObject({ modelId: 'dep' });
    expect(resolveModel(BEDROCK)).toMatchObject({ modelId: 'anthropic.x' });
  });

  it('throws ConfigMissingError for an unknown provider or a missing var', () => {
    expect(() => resolveModel({ ...AZURE, AI_PROVIDER: 'openai' })).toThrow(ConfigMissingError);
    expect(() => resolveModel({ ...AZURE, AI_PROVIDER: undefined })).toThrow(ConfigMissingError);
    expect(() => resolveModel({ ...AZURE, AI_MODEL: '' })).toThrow(ConfigMissingError);
    expect(() => resolveModel({ ...AZURE, AZURE_AI_KEY: '' })).toThrow(ConfigMissingError);
    expect(() => resolveModel({ ...BEDROCK, AWS_SECRET_ACCESS_KEY: undefined })).toThrow(ConfigMissingError);
  });
});

describe('tools', () => {
  it('searchServices finds seed ids for English / Thai queries, at most 10, empty for nonsense', () => {
    expect(findServices('mouse').map((s) => s.id)).toContain('sdf_002');
    expect(findServices('แจ้งปัญหา Mouse')[0]).toMatchObject({ id: 'sdf_002', name: expect.any(String), description: expect.any(String) });
    expect(findServices('ขอ')).toHaveLength(10); // 49 seed hits, capped
    expect(findServices('zzqx-nothing')).toEqual([]);
    expect(findServices('เมาส์').map((s) => s.id)).toContain('sdf_002'); // Thai via fallback keywords
  });
});

describe('createAssistAgent', () => {
  it('runs searchPages then navigates to a route it returned', async () => {
    const NAV = { kind: 'navigate', serviceDefinitionId: null, route: '/calls/search', summary: null, reply: null } as const;
    const model = mockModel(toolCallStep('อยากค้นหาเรื่องที่เคยแจ้ง', 'searchPages'), textStep(JSON.stringify(NAV)));
    const result = await createAssistAgent(model).generate({ prompt: 'อยากค้นหาเรื่องที่เคยแจ้ง' });
    expect(result.output).toEqual(NAV);
    expect(JSON.stringify(model.doGenerateCalls[1]!.prompt)).toContain('/calls/search');
    expect(JSON.stringify(model.doGenerateCalls[0]!.prompt)).not.toContain('/approvals'); // no inline route list
  });

  it('runs searchServices then returns the structured output in 2 steps', async () => {
    const model = mockModel(toolCallStep('mouse'), textStep(JSON.stringify(VALID)));
    const result = await createAssistAgent(model).generate({ prompt: 'เมาส์เสีย' });
    expect(result.output).toEqual(VALID);
    expect(result.steps).toHaveLength(2);
    // step 2 saw the tool result, so the tool really ran
    expect(JSON.stringify(model.doGenerateCalls[1]!.prompt)).toContain('sdf_002');
    // strict-mode friendly schema: all 5 keys required, no extra keys
    expect(model.doGenerateCalls[0]!.responseFormat).toMatchObject({
      type: 'json',
      schema: { required: ['kind', 'serviceDefinitionId', 'route', 'summary', 'reply'], additionalProperties: false },
    });
  });
});

function fakeReq(method: string, body?: string): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.method = method;
  queueMicrotask(() => {
    if (body !== undefined) req.emit('data', Buffer.from(body));
    req.emit('end');
  });
  return req;
}

function fakeRes() {
  const res = { statusCode: 0, body: '', setHeader: vi.fn(), end: vi.fn((b: string) => { res.body = b; }) };
  return res as typeof res & ServerResponse;
}

const call = async (req: IncomingMessage, env = AZURE) => {
  const res = fakeRes();
  await handleAssist(req, res, env);
  return { status: res.statusCode, body: JSON.parse(res.body) as unknown };
};
const post = (b: unknown) => fakeReq('POST', JSON.stringify(b));
const useModel = (m: MockLanguageModelV4) => vi.mocked(resolveModel).mockReturnValueOnce(m);

describe('handleAssist', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('405 for non-POST, 400 for bad bodies, 500 when config is missing', async () => {
    expect(await call(fakeReq('GET'))).toEqual({ status: 405, body: { error: 'method_not_allowed' } });
    expect((await call(fakeReq('POST', '{bad'))).status).toBe(400);
    expect((await call(post({ text: '   ', page: 'x' }))).status).toBe(400);
    expect((await call(post({ text: 'a'.repeat(1001), page: 'x' }))).status).toBe(400);
    expect((await call(post({ text: 'a', page: 'x'.repeat(61) }))).status).toBe(400);
    expect((await call(fakeReq('POST', 'x'.repeat(9000)))).status).toBe(400);
    expect(await call(post({ text: 'a', page: 'x' }), { ...AZURE, AZURE_AI_KEY: '' })).toEqual({ status: 500, body: { error: 'config_missing' } });
    expect(await call(post({ text: 'a', page: 'x' }), { ...AZURE, AI_PROVIDER: 'nope' })).toEqual({ status: 500, body: { error: 'config_missing' } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('200 with only the 5 fields after a tool step', async () => {
    useModel(mockModel(toolCallStep('mouse'), textStep(JSON.stringify({ ...VALID, extra: 1 }))));
    expect(await call(post({ text: ' เมาส์เสีย ', page: 'My Space' }))).toEqual({ status: 200, body: VALID });
  });

  it('reply: 200 with the text, 502 when blank, truncated to 1000, null for other kinds; reply text never logged', async () => {
    const REPLY = { kind: 'reply', serviceDefinitionId: null, route: null, summary: null, reply: ' สวัสดีครับ REPLY-SECRET ' };
    useModel(mockModel(textStep(JSON.stringify(REPLY))));
    expect(await call(post({ text: 'สวัสดี', page: 'x' }))).toEqual({ status: 200, body: { ...REPLY, reply: 'สวัสดีครับ REPLY-SECRET' } });
    useModel(mockModel(textStep(JSON.stringify({ ...REPLY, reply: '   ' }))));
    expect(await call(post({ text: 'สวัสดี', page: 'x' }))).toEqual({ status: 502, body: { error: 'upstream' } });
    useModel(mockModel(textStep(JSON.stringify({ ...REPLY, reply: null }))));
    expect((await call(post({ text: 'สวัสดี', page: 'x' }))).status).toBe(502);
    useModel(mockModel(textStep(JSON.stringify({ ...REPLY, reply: 'ก'.repeat(1500) }))));
    const long = await call(post({ text: 'สวัสดี', page: 'x' }));
    expect((long.body as { reply: string }).reply).toBe('ก'.repeat(1000));
    useModel(mockModel(toolCallStep('mouse'), textStep(JSON.stringify({ ...VALID, reply: 'stray' }))));
    expect(await call(post({ text: 'เมาส์เสีย', page: 'x' }))).toEqual({ status: 200, body: VALID });
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain('empty_reply');
    expect(logged).not.toMatch(/REPLY-SECRET|สวัสดี|stray/);
  });

  it('502 on invalid model output', async () => {
    useModel(mockModel(textStep('{"kind":"create"}')));
    expect(await call(post({ text: 'a', page: 'x' }))).toEqual({ status: 502, body: { error: 'upstream' } });
    useModel(mockModel(textStep('not json')));
    expect((await call(post({ text: 'a', page: 'x' }))).status).toBe(502);
  });

  it('502 when the model navigates to a route outside the page guide, without logging the route', async () => {
    useModel(mockModel(textStep(JSON.stringify({ kind: 'navigate', serviceDefinitionId: null, route: '/calls/new', summary: null, reply: null }))));
    expect(await call(post({ text: 'a', page: 'x' }))).toEqual({ status: 502, body: { error: 'upstream' } });
    useModel(mockModel(textStep(JSON.stringify({ kind: 'navigate', serviceDefinitionId: null, route: '/x-SECRET', summary: null, reply: null }))));
    expect((await call(post({ text: 'a', page: 'x' }))).status).toBe(502);
    useModel(mockModel(textStep(JSON.stringify({ kind: 'navigate', serviceDefinitionId: null, route: '/approvals', summary: null, reply: null }))));
    expect((await call(post({ text: 'a', page: 'x' }))).status).toBe(200);
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain('route_not_allowed');
    expect(logged).not.toMatch(/x-SECRET|calls\/new/);
  });

  it('504 when the timeout signal aborts the model call', async () => {
    const ctrl = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(ctrl.signal);
    setTimeout(() => ctrl.abort(new DOMException('t', 'TimeoutError')), 10);
    useModel(new MockLanguageModelV4({
      doGenerate: ({ abortSignal }) => new Promise((_, reject) => {
        abortSignal?.addEventListener('abort', () => reject(abortSignal.reason));
      }),
    }));
    expect(await call(post({ text: 'a', page: 'x' }))).toEqual({ status: 504, body: { error: 'timeout' } });
  });

  it('real azure model posts to {endpoint}/responses with the api-key header; 502 on upstream error', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('secret upstream detail', { status: 400 }));
    expect(await call(post({ text: 'a', page: 'x' }))).toEqual({ status: 502, body: { error: 'upstream' } });
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(String(url)).toBe('https://r.services.ai.azure.com/openai/v1/responses');
    expect(new Headers(init!.headers).get('api-key')).toBe('k-123');
    expect(JSON.parse(init!.body as string)).toMatchObject({ model: 'dep' });
  });

  it('never logs the user text, key, upstream body or model output', async () => {
    useModel(mockModel(toolCallStep('mouse'), textStep(JSON.stringify({ ...VALID, summary: 'MODEL-SECRET' }))));
    await call(post({ text: 'เมาส์ 0811111111', page: 'x' }));
    useModel(mockModel(textStep('{"kind":"create","summary":"MODEL-SECRET"}')));
    await call(post({ text: 'เมาส์ 0811111111', page: 'x' }));
    vi.mocked(fetch).mockResolvedValue(new Response('secret upstream detail', { status: 401 }));
    await call(post({ text: 'เมาส์ 0811111111', page: 'x' }), { ...AZURE });
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain('azure');
    expect(logged).not.toMatch(/0811111111|เมาส์|k-123|secret upstream|MODEL-SECRET/);
  });
});

describe('stallRetryFetch', () => {
  const never = (_i: unknown, init?: RequestInit) =>
    new Promise<Response>((_r, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)));

  it('cuts a stalled request and retries once', async () => {
    const base = vi.fn().mockImplementationOnce(never).mockResolvedValueOnce(new Response('ok'));
    const res = await stallRetryFetch(base as unknown as typeof fetch, 20)('https://x.test');
    expect(await res.text()).toBe('ok');
    expect(base).toHaveBeenCalledTimes(2);
  });

  it('gives up after the second stall', async () => {
    const base = vi.fn().mockImplementation(never);
    await expect(stallRetryFetch(base as unknown as typeof fetch, 20)('https://x.test')).rejects.toBeTruthy();
    expect(base).toHaveBeenCalledTimes(2);
  });

  it('does not retry when the caller aborted', async () => {
    const base = vi.fn().mockImplementation(never);
    const ctrl = new AbortController();
    const p = stallRetryFetch(base as unknown as typeof fetch, 1000)('https://x.test', { signal: ctrl.signal });
    ctrl.abort();
    await expect(p).rejects.toBeTruthy();
    expect(base).toHaveBeenCalledTimes(1);
  });

  it('does not retry a non-timeout error', async () => {
    const base = vi.fn().mockRejectedValue(new TypeError('network'));
    await expect(stallRetryFetch(base as unknown as typeof fetch, 1000)('https://x.test')).rejects.toThrow('network');
    expect(base).toHaveBeenCalledTimes(1);
  });
});
