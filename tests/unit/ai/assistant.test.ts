import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_ERROR_MESSAGES } from '@/domain/types';
import { RuleBasedAssistant } from '@/features/ai-assistant/ruleBased';
import { buildDataset } from '../../fixtures';

const rb = new RuleBasedAssistant(buildDataset());

describe('RuleBasedAssistant', () => {
  it('maps a symptom keyword to a pre-filled draft (case-insensitive)', async () => {
    const r = await rb.suggest('MOUSE เสีย คลิกไม่ติด', 'My Space');
    expect(r).toEqual({
      kind: 'draft',
      draft: {
        serviceDefinitionId: 'sdf_002', urgency: '3-Medium', impact: '4-Minor/Localized',
        summary: 'MOUSE เสีย คลิกไม่ติด', notes: '<p>MOUSE เสีย คลิกไม่ติด</p>',
      },
    });
  });

  it('escapes HTML in the notes and caps the summary at 200 characters', async () => {
    const text = `เมาส์ <img src=x onerror=alert(1)> ${'ก'.repeat(300)}`;
    const r = await rb.suggest(text, 'x');
    if (r.kind !== 'draft') throw new Error('expected draft');
    expect(r.draft.summary).toHaveLength(200);
    expect(r.draft.notes).not.toContain('<img');
    expect(r.draft.notes).toContain('&#60;img');
  });

  it('first matching rule in data order wins', async () => {
    const r = await rb.suggest('keyboard และ mouse', 'x');
    expect(r.kind === 'draft' && r.draft.serviceDefinitionId).toBe('sdf_002');
  });

  it('maps an intent to a real page', async () => {
    expect(await rb.suggest('อยากค้นหาเรื่อง', 'x')).toEqual({ kind: 'navigate', route: '/calls/search' });
    expect(await rb.suggest('ดูเรื่องที่ค้าง', 'x')).toEqual({ kind: 'navigate', route: '/my-space' });
  });

  it('returns unknown for a route that is not a page and for no match / blank input', async () => {
    expect(await rb.suggest('ดูคู่มือ', 'x')).toEqual({ kind: 'unknown' });
    expect(await rb.suggest('สวัสดี', 'x')).toEqual({ kind: 'unknown' });
    expect(await rb.suggest('   ', 'x')).toEqual({ kind: 'unknown' });
  });
});

describe('askAssistant', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('mock mode uses the rules with no notice and no network call', async () => {
    vi.stubEnv('VITE_AI_MODE', 'mock');
    const { askAssistant } = await import('@/features/ai-assistant/assistant');
    const answer = await askAssistant('เมาส์เสีย', 'My Space');
    expect(answer).toMatchObject({ result: { kind: 'draft' }, notice: null });
    expect(fetch).not.toHaveBeenCalled();
  });

  // shortcut: no Azure adapter yet (task 4.6 blocked) — azure mode always falls back; add 200 / 502 / timeout / bad JSON cases with 4.6
  it('azure mode falls back to the rules with the AI_UNAVAILABLE notice and logs no user text', async () => {
    vi.stubEnv('VITE_AI_MODE', 'azure');
    const { askAssistant } = await import('@/features/ai-assistant/assistant');
    const answer = await askAssistant('เมาส์เสีย ติดต่อ 0811111111', 'My Space');
    expect(answer).toEqual({ result: expect.objectContaining({ kind: 'draft' }), notice: APP_ERROR_MESSAGES.AI_UNAVAILABLE });
    expect(fetch).not.toHaveBeenCalled();
    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).toContain('ai.fallback');
    expect(logged).not.toContain('0811111111');
  });
});
