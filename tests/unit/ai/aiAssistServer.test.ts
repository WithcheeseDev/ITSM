import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { simulateReadableStream } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAssistAgent } from '../../../server/ai/agent';
import { ConfigMissingError, resolveModel, stallRetryFetch, type AiEnv } from '../../../server/ai/model';
import { createAssistTools, findServices } from '../../../server/ai/tools';
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
type Step = ReturnType<typeof textStep | typeof toolCallStep>;
type StreamPart = Awaited<ReturnType<MockLanguageModelV4['doStream']>>['stream'] extends ReadableStream<infer P> ? P : never;
/** The same step as stream parts; text is cut into 8-char deltas so the partial output grows over several chunks. */
const streamStep = (step: Step) => {
  const parts: StreamPart[] = [{ type: 'stream-start', warnings: [] }];
  for (const c of step.content) {
    if (c.type !== 'text') {
      parts.push(c);
      continue;
    }
    parts.push({ type: 'text-start', id: 't' });
    for (let i = 0; i < c.text.length; i += 8) parts.push({ type: 'text-delta', id: 't', delta: c.text.slice(i, i + 8) });
    parts.push({ type: 'text-end', id: 't' });
  }
  parts.push({ type: 'finish', finishReason: step.finishReason, usage: step.usage });
  return { stream: simulateReadableStream({ chunks: parts }) };
};
const mockModel = (...steps: Step[]) => new MockLanguageModelV4({ doGenerate: steps, doStream: steps.map(streamStep) });

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

  it('recallConversation exists only with history and returns the turns', async () => {
    expect(createAssistTools([])).not.toHaveProperty('recallConversation');
    const turns = [{ user: 'เมาส์เสีย', assistant: 'ร่างคำขอ Mouse' }];
    const tools = createAssistTools(turns);
    expect(Object.keys(tools)).toEqual(['searchServices', 'searchPages', 'recallConversation']);
    if (!('recallConversation' in tools)) throw new Error('missing');
    expect(await tools.recallConversation.execute!({}, { toolCallId: 't', messages: [], context: {} })).toEqual({ turns });
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
  const res = Object.assign(new EventEmitter(), {
    statusCode: 0,
    body: '',
    headers: {} as Record<string, string>,
    destroyed: false,
    writableEnded: false,
    writableFinished: false,
    setHeader: vi.fn((k: string, v: string) => {
      res.headers[k.toLowerCase()] = v;
    }),
    write: vi.fn((b: string) => {
      res.body += b;
      return true;
    }),
    end: vi.fn((b?: string) => {
      if (b) res.body += b;
      res.writableEnded = true;
      res.writableFinished = true;
    }),
    /** what Node does when the client drops the connection before the response ends */
    disconnect() {
      res.destroyed = true;
      res.emit('close');
    },
  });
  return res as unknown as typeof res & ServerResponse;
}

type Line = { type: 'delta'; text: string } | { type: 'done'; result: unknown } | { type: 'error'; error: string };
const parseLines = (body: string) => body.split('\n').filter((l) => l !== '').map((l) => JSON.parse(l) as Line);

/** Plain JSON responses → { status, body }; NDJSON → checks the stream framing, then { status, deltas, body: terminal line }. */
const call = async (req: IncomingMessage, env = AZURE) => {
  const res = fakeRes();
  await handleAssist(req, res, env);
  if (!res.headers['content-type']?.startsWith('application/x-ndjson')) return { status: res.statusCode, body: JSON.parse(res.body) as unknown };
  expect(res.statusCode).toBe(200);
  expect(res.headers['content-type']).toBe('application/x-ndjson; charset=utf-8');
  expect(res.headers['cache-control']).toBe('no-cache');
  expect(res.body.endsWith('\n')).toBe(true);
  expect(res.end).toHaveBeenCalledTimes(1);
  const lines = parseLines(res.body);
  const terminal = lines.filter((l) => l.type !== 'delta');
  expect(terminal).toHaveLength(1); // exactly one terminal line, always last
  expect(lines.at(-1)).toBe(terminal[0]);
  const deltas = lines.flatMap((l) => (l.type === 'delta' ? [l.text] : []));
  return { status: 200, deltas, body: terminal[0] as unknown };
};
const post = (b: unknown) => fakeReq('POST', JSON.stringify(b));
const useModel = (m: MockLanguageModelV4) => vi.mocked(resolveModel).mockReturnValueOnce(m);
const done = (result: unknown) => ({ type: 'done', result });
const UPSTREAM = { type: 'error', error: 'upstream' };
/** model call that only ends when its abort signal fires; exposes the signal it got */
const hangingModel = () => {
  const seen: { signal?: AbortSignal } = {};
  const model = new MockLanguageModelV4({
    doStream: ({ abortSignal }) =>
      new Promise((_, reject) => {
        seen.signal = abortSignal;
        abortSignal?.addEventListener('abort', () => reject(abortSignal.reason));
      }),
  });
  return { model, seen };
};
/** stream that opens, sends a partial reply, then only ends (with an error) when its abort signal fires */
const midStreamModel = () => {
  const seen: { signal?: AbortSignal } = {};
  const model = new MockLanguageModelV4({
    doStream: async ({ abortSignal }) => {
      seen.signal = abortSignal;
      const stream = new ReadableStream<StreamPart>({
        start(c) {
          c.enqueue({ type: 'stream-start', warnings: [] });
          c.enqueue({ type: 'text-start', id: 't' });
          c.enqueue({ type: 'text-delta', id: 't', delta: '{"kind":"reply","serviceDefinitionId":null,"route":null,"summary":null,"reply":"PART' });
          c.enqueue({ type: 'text-delta', id: 't', delta: 'IAL-TEXT' });
          abortSignal?.addEventListener('abort', () => c.error(abortSignal.reason));
        },
      });
      return { stream };
    },
  });
  return { model, seen };
};

describe('handleAssist', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('405 for non-POST, 400 for bad bodies, 500 when config is missing (plain JSON)', async () => {
    expect(await call(fakeReq('GET'))).toEqual({ status: 405, body: { error: 'method_not_allowed' } });
    expect((await call(fakeReq('POST', '{bad'))).status).toBe(400);
    expect((await call(post({ text: '   ', page: 'x' }))).status).toBe(400);
    expect((await call(post({ text: 'a'.repeat(1001), page: 'x' }))).status).toBe(400);
    expect((await call(post({ text: 'a', page: 'x'.repeat(61) }))).status).toBe(400);
    expect((await call(fakeReq('POST', 'x'.repeat(33 * 1024)))).status).toBe(400);
    expect(await call(post({ text: 'a', page: 'x' }), { ...AZURE, AZURE_AI_KEY: '' })).toEqual({ status: 500, body: { error: 'config_missing' } });
    expect(await call(post({ text: 'a', page: 'x' }), { ...AZURE, AI_PROVIDER: 'nope' })).toEqual({ status: 500, body: { error: 'config_missing' } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('draft: only the 5 fields after a tool step, no deltas', async () => {
    useModel(mockModel(toolCallStep('mouse'), textStep(JSON.stringify({ ...VALID, extra: 1 }))));
    expect(await call(post({ text: ' เมาส์เสีย ', page: 'My Space' }))).toEqual({ status: 200, deltas: [], body: done(VALID) });
  });

  it('reply: streams deltas that build the reply, then done with the trimmed text; reply text never logged', async () => {
    const REPLY = { kind: 'reply', serviceDefinitionId: null, route: null, summary: null, reply: '  สวัสดีครับ มีอะไรให้ช่วย REPLY-SECRET  ' };
    useModel(mockModel(textStep(JSON.stringify(REPLY))));
    const r = await call(post({ text: 'สวัสดี', page: 'x' }));
    const doneReply = 'สวัสดีครับ มีอะไรให้ช่วย REPLY-SECRET';
    expect(r.body).toEqual(done({ ...REPLY, reply: doneReply }));
    expect(r.deltas!.length).toBeGreaterThanOrEqual(2);
    expect(r.deltas!.join('')).toBe(doneReply); // every delta so far is a prefix of the done reply; here it is all of it

    useModel(mockModel(textStep(JSON.stringify({ ...REPLY, reply: 'ก'.repeat(1500) }))));
    const long = await call(post({ text: 'สวัสดี', page: 'x' }));
    expect(long.deltas!.join('')).toBe('ก'.repeat(1000)); // deltas stop at MAX_REPLY
    expect(long.body).toEqual(done({ ...REPLY, reply: 'ก'.repeat(1000) }));

    useModel(mockModel(toolCallStep('mouse'), textStep(JSON.stringify({ ...VALID, reply: 'stray' }))));
    expect(await call(post({ text: 'เมาส์เสีย', page: 'x' }))).toEqual({ status: 200, deltas: [], body: done(VALID) });
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).not.toMatch(/REPLY-SECRET|สวัสดี|มีอะไร|ก{2}|stray/);
  });

  it('reply: blank or null reply → error upstream (empty_reply)', async () => {
    const REPLY = { kind: 'reply', serviceDefinitionId: null, route: null, summary: null, reply: '   ' };
    useModel(mockModel(textStep(JSON.stringify(REPLY))));
    expect(await call(post({ text: 'สวัสดี', page: 'x' }))).toEqual({ status: 200, deltas: [], body: UPSTREAM });
    useModel(mockModel(textStep(JSON.stringify({ ...REPLY, reply: null }))));
    expect((await call(post({ text: 'สวัสดี', page: 'x' }))).body).toEqual(UPSTREAM);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).toContain('empty_reply');
  });

  it('history: trimmed turns reach the agent via recallConversation; missing = no tool; never logged', async () => {
    const NAV = { kind: 'navigate', serviceDefinitionId: null, route: '/approvals', summary: null, reply: null } as const;
    const recallStep = toolCallStep('', 'recallConversation');
    recallStep.content[0]!.input = '{}';
    const withHistory = mockModel(recallStep, textStep(JSON.stringify(NAV)));
    useModel(withHistory);
    const history = [{ user: '  HIST-USER เมาส์เสีย  ', assistant: ' HIST-ASSIST ร่างคำขอ Mouse ' }];
    expect(await call(post({ text: 'แล้วคีย์บอร์ดล่ะ', page: 'x', history }))).toEqual({ status: 200, deltas: [], body: done(NAV) });
    expect(withHistory.doStreamCalls[0]!.tools?.map((t) => t.name)).toContain('recallConversation');
    const step2 = JSON.stringify(withHistory.doStreamCalls[1]!.prompt);
    expect(step2).toContain('"user":"HIST-USER เมาส์เสีย"');
    expect(step2).toContain('"assistant":"HIST-ASSIST ร่างคำขอ Mouse"');

    const noHistory = mockModel(textStep(JSON.stringify(NAV)));
    useModel(noHistory);
    expect((await call(post({ text: 'a', page: 'x' }))).body).toEqual(done(NAV));
    expect(noHistory.doStreamCalls[0]!.tools?.map((t) => t.name)).not.toContain('recallConversation');

    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain('"turns":1');
    expect(logged).not.toMatch(/HIST-USER|HIST-ASSIST|เมาส์|คีย์บอร์ด/);
  });

  it('history: 400 for bad shapes, accepts a ~20KB Thai body', async () => {
    const turn = { user: 'u', assistant: 'a' };
    const bad = async (history: unknown) => (await call(post({ text: 'a', page: 'x', history }))).status;
    expect(await bad(Array(7).fill(turn))).toBe(400);
    expect(await bad([{ ...turn, extra: 1 }])).toBe(400);
    expect(await bad([{ user: '   ', assistant: 'a' }])).toBe(400);
    expect(await bad([{ user: '', assistant: 'a' }])).toBe(400);
    expect(await bad([{ user: 'u', assistant: 'a'.repeat(501) }])).toBe(400);
    expect(await bad([{ user: 'u' }])).toBe(400);
    expect(await bad(turn)).toBe(400);
    expect(await bad('u')).toBe(400);
    expect(await bad(null)).toBe(400);
    expect(fetch).not.toHaveBeenCalled();

    const big = { text: 'ข'.repeat(1000), page: 'x', history: Array(6).fill({ user: 'ก'.repeat(500), assistant: 'ค'.repeat(500) }) };
    expect(Buffer.byteLength(JSON.stringify(big))).toBeGreaterThan(20 * 1024);
    const UNKNOWN = { kind: 'unknown', serviceDefinitionId: null, route: null, summary: null, reply: null };
    useModel(mockModel(textStep(JSON.stringify(UNKNOWN))));
    expect((await call(post(big))).body).toEqual(done(UNKNOWN));
  });

  it('error upstream on invalid model output', async () => {
    useModel(mockModel(textStep('{"kind":"create"}')));
    expect((await call(post({ text: 'a', page: 'x' }))).body).toEqual(UPSTREAM);
    useModel(mockModel(textStep('not json')));
    expect((await call(post({ text: 'a', page: 'x' }))).body).toEqual(UPSTREAM);
  });

  it('error upstream when the model navigates outside the page guide, without logging the route; navigate has no deltas', async () => {
    useModel(mockModel(textStep(JSON.stringify({ kind: 'navigate', serviceDefinitionId: null, route: '/calls/new', summary: null, reply: null }))));
    expect((await call(post({ text: 'a', page: 'x' }))).body).toEqual(UPSTREAM);
    useModel(mockModel(textStep(JSON.stringify({ kind: 'navigate', serviceDefinitionId: null, route: '/x-SECRET', summary: null, reply: null }))));
    expect((await call(post({ text: 'a', page: 'x' }))).body).toEqual(UPSTREAM);
    const NAV = { kind: 'navigate', serviceDefinitionId: null, route: '/approvals', summary: null, reply: null };
    useModel(mockModel(textStep(JSON.stringify(NAV))));
    expect(await call(post({ text: 'a', page: 'x' }))).toEqual({ status: 200, deltas: [], body: done(NAV) });
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain('route_not_allowed');
    expect(logged).not.toMatch(/x-SECRET|calls\/new/);
  });

  it('error upstream when the model call throws, without logging the error', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    useModel(new MockLanguageModelV4({ doStream: async () => { throw new Error('THROWN-SECRET'); } }));
    expect((await call(post({ text: 'a', page: 'x' }))).body).toEqual(UPSTREAM);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('THROWN-SECRET');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('error upstream when the stream errors after a partial reply', async () => {
    const parts: StreamPart[] = [
      { type: 'stream-start', warnings: [] },
      { type: 'text-start', id: 't' },
      { type: 'text-delta', id: 't', delta: '{"kind":"reply","serviceDefinitionId":null,"route":null,"summary":null,"reply":"MID-' },
      { type: 'text-delta', id: 't', delta: 'TEXT' },
      { type: 'error', error: new Error('MID-SECRET') },
    ];
    useModel(new MockLanguageModelV4({ doStream: { stream: simulateReadableStream({ chunks: parts }) } }));
    expect((await call(post({ text: 'a', page: 'x' }))).body).toEqual(UPSTREAM);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toMatch(/MID-/);
  });

  it('error timeout when the timeout signal aborts the model call', async () => {
    const ctrl = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(ctrl.signal);
    setTimeout(() => ctrl.abort(new DOMException('t', 'TimeoutError')), 10);
    const { model, seen } = hangingModel();
    useModel(model);
    expect((await call(post({ text: 'a', page: 'x' }))).body).toEqual({ type: 'error', error: 'timeout' });
    expect(seen.signal?.aborted).toBe(true);
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).toContain('timeout');
  });

  it('client disconnect aborts the model call, writes nothing and is not logged as an error', async () => {
    const { model, seen } = hangingModel();
    useModel(model);
    const res = fakeRes();
    const pending = handleAssist(post({ text: 'a', page: 'x' }), res, AZURE);
    await vi.waitFor(() => expect(seen.signal).toBeDefined());
    res.disconnect();
    await pending;
    expect(seen.signal!.aborted).toBe(true);
    expect(res.body).toBe('');
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toMatch(/504|timeout|502|upstream/);
  });

  it('timeout after the stream opened: deltas, then one error timeout line', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    const ctrl = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(ctrl.signal);
    const { model, seen } = midStreamModel();
    useModel(model);
    setTimeout(() => ctrl.abort(new DOMException('t', 'TimeoutError')), 30);
    const r = await call(post({ text: 'a', page: 'x' }));
    expect(r.deltas!.length).toBeGreaterThanOrEqual(1);
    expect('PARTIAL-TEXT'.startsWith(r.deltas!.join(''))).toBe(true);
    expect(r.body).toEqual({ type: 'error', error: 'timeout' });
    expect(seen.signal?.aborted).toBe(true);
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain('504');
    expect(logged).not.toMatch(/502|PART/);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('client disconnect after the stream opened: settles, ends once, no error log', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    const { model, seen } = midStreamModel();
    useModel(model);
    const res = fakeRes();
    const pending = handleAssist(post({ text: 'a', page: 'x' }), res, AZURE);
    await vi.waitFor(() => expect(res.body).toContain('"type":"delta"'));
    res.disconnect();
    await pending;
    expect(seen.signal?.aborted).toBe(true);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(parseLines(res.body).every((l) => l.type === 'delta')).toBe(true); // no terminal line: nobody is listening
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toMatch(/504|timeout|502|upstream/);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('real azure model streams from {endpoint}/responses with the api-key header; error upstream on upstream error', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('secret upstream detail', { status: 400 }));
    expect((await call(post({ text: 'a', page: 'x' }))).body).toEqual(UPSTREAM);
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(String(url)).toBe('https://r.services.ai.azure.com/openai/v1/responses');
    expect(new Headers(init!.headers).get('api-key')).toBe('k-123');
    expect(JSON.parse(init!.body as string)).toMatchObject({ model: 'dep', stream: true });
  });

  it('never logs the user text, key, upstream body or model output', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    useModel(mockModel(toolCallStep('mouse'), textStep(JSON.stringify({ ...VALID, summary: 'MODEL-SECRET' }))));
    await call(post({ text: 'เมาส์ 0811111111', page: 'x' }));
    useModel(mockModel(textStep('{"kind":"create","summary":"MODEL-SECRET"}')));
    await call(post({ text: 'เมาส์ 0811111111', page: 'x' }));
    vi.mocked(fetch).mockResolvedValue(new Response('secret upstream detail', { status: 401 }));
    await call(post({ text: 'เมาส์ 0811111111', page: 'x' }), { ...AZURE });
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain('azure');
    expect(logged).not.toMatch(/0811111111|เมาส์|k-123|secret upstream|MODEL-SECRET/);
    expect(errorSpy).not.toHaveBeenCalled(); // the SDK default onError would console.error the request / response
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

  /** headers arrive at once; the body sends its chunk after `ms`. Records the signal the request got. */
  const slowBody = (ms: number) => {
    const seen: { signal?: AbortSignal | null } = {};
    const base = vi.fn(async (_i: unknown, init?: RequestInit) => {
      seen.signal = init?.signal;
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          setTimeout(() => {
            c.enqueue(new TextEncoder().encode('late'));
            c.close();
          }, ms);
        },
      });
      return new Response(body);
    });
    return { base: base as unknown as typeof fetch, calls: base, seen };
  };

  it('does not abort a body that is still streaming after the cap', async () => {
    const { base, calls, seen } = slowBody(60);
    const res = await stallRetryFetch(base, 20)('https://x.test');
    expect(await res.text()).toBe('late');
    expect(seen.signal?.aborted).toBe(false);
    expect(calls).toHaveBeenCalledTimes(1);
  });

  it('the caller abort still reaches the request after the headers', async () => {
    const { base, seen } = slowBody(60);
    const ctrl = new AbortController();
    await stallRetryFetch(base, 20)('https://x.test', { signal: ctrl.signal });
    expect(seen.signal?.aborted).toBe(false);
    ctrl.abort();
    expect(seen.signal?.aborted).toBe(true);
  });

  it('does not retry a non-timeout error', async () => {
    const base = vi.fn().mockRejectedValue(new TypeError('network'));
    await expect(stallRetryFetch(base as unknown as typeof fetch, 1000)('https://x.test')).rejects.toThrow('network');
    expect(base).toHaveBeenCalledTimes(1);
  });
});
