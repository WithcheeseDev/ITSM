import { EventEmitter } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import seed from '@/data/database.json';
import {
  buildAzureBody, buildInstructions, extractOutputText, handleAssist, parseAssistOutput,
} from '../../../server/aiAssist';

const VALID = { kind: 'draft', serviceDefinitionId: 'sdf_002', route: null, summary: 'Mouse เสีย' };
const azureJson = (text: string) => ({
  output: [
    { type: 'reasoning', summary: [] },
    { type: 'message', content: [{ type: 'output_text', text }] },
  ],
});

describe('pure helpers', () => {
  it('extractOutputText skips a leading reasoning item', () => {
    expect(extractOutputText(azureJson('{"a":1}'))).toBe('{"a":1}');
    expect(extractOutputText({ output: [{ type: 'reasoning' }] })).toBeNull();
    expect(extractOutputText(null)).toBeNull();
  });

  it('parseAssistOutput keeps only the 4 fields and rejects bad JSON / missing or mistyped fields', () => {
    expect(parseAssistOutput(JSON.stringify({ ...VALID, extra: 1 }))).toEqual(VALID);
    expect(parseAssistOutput('not json')).toBeNull();
    expect(parseAssistOutput(JSON.stringify({ kind: 'draft', serviceDefinitionId: 'x', route: null }))).toBeNull();
    expect(parseAssistOutput(JSON.stringify({ ...VALID, kind: 'create' }))).toBeNull();
    expect(parseAssistOutput(JSON.stringify({ ...VALID, route: 3 }))).toBeNull();
  });

  it('buildAzureBody sends model, input = text and a strict json_schema', () => {
    const body = buildAzureBody('gpt-x', 'INSTR', 'เมาส์เสีย');
    expect(body).toMatchObject({ model: 'gpt-x', instructions: 'INSTR', input: 'เมาส์เสีย' });
    expect(body.text.format).toMatchObject({ type: 'json_schema', name: 'ai_assist', strict: true });
    expect(body.text.format.schema).toMatchObject({
      additionalProperties: false, required: ['kind', 'serviceDefinitionId', 'route', 'summary'],
    });
  });

  it('buildInstructions lists services and only routes that are real pages', () => {
    const text = buildInstructions(seed);
    expect(text).toContain('sdf_002 | ');
    expect(text).toContain('/calls/search | hints:');
    expect(text).not.toContain('/answers');
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

const ENV = { AZURE_AI_ENDPOINT: 'https://r.services.ai.azure.com/openai/v1/', AZURE_AI_DEPLOYMENT: 'dep', AZURE_AI_KEY: 'k-123' };
const call = async (req: IncomingMessage, env = ENV) => {
  const res = fakeRes();
  await handleAssist(req, res, env);
  return { status: res.statusCode, body: JSON.parse(res.body) as unknown };
};
const post = (b: unknown) => fakeReq('POST', JSON.stringify(b));

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
    expect(await call(post({ text: 'a', page: 'x' }), { ...ENV, AZURE_AI_KEY: '' })).toEqual({ status: 500, body: { error: 'config_missing' } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('200 with the parsed object; calls {endpoint}/responses with the api-key header', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(azureJson(JSON.stringify(VALID)))));
    expect(await call(post({ text: ' เมาส์เสีย ', page: 'My Space' }))).toEqual({ status: 200, body: VALID });
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe('https://r.services.ai.azure.com/openai/v1/responses');
    expect(init!.headers).toMatchObject({ 'api-key': 'k-123' });
    expect(JSON.parse(init!.body as string)).toMatchObject({ model: 'dep', input: 'เมาส์เสีย' });
  });

  it('502 on non-2xx / bad output, 504 on timeout; never logs key or text', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('secret upstream detail', { status: 429 }));
    expect(await call(post({ text: 'เมาส์ 0811111111', page: 'x' }))).toEqual({ status: 502, body: { error: 'upstream' } });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify(azureJson('{"kind":"draft"}'))));
    expect((await call(post({ text: 'a', page: 'x' }))).status).toBe(502);
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException('t', 'TimeoutError'));
    expect(await call(post({ text: 'a', page: 'x' }))).toEqual({ status: 504, body: { error: 'timeout' } });
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).not.toMatch(/0811111111|k-123|secret upstream/);
  });
});
