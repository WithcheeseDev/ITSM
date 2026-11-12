import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildEntry, logger, redact, REDACTED } from '@/shared/logger';

describe('logger', () => {
  afterEach(() => vi.restoreAllMocks());

  it('masks deny-listed keys, keeps ids', () => {
    const out = redact({
      callId: 'call_002',
      userId: 'u_1',
      name: 'Somchai',
      email: 'a@example.com',
      phone: '0800000000',
      summary: 'printer broken',
      notes: '<p>x</p>',
      comment: 'c',
      text: 't',
      apiKey: 'secret',
      requestorName: 'X',
    });
    expect(out).toEqual({
      callId: 'call_002',
      userId: 'u_1',
      name: REDACTED,
      email: REDACTED,
      phone: REDACTED,
      summary: REDACTED,
      notes: REDACTED,
      comment: REDACTED,
      text: REDACTED,
      apiKey: REDACTED,
      requestorName: REDACTED,
    });
  });

  it('masks nested objects and arrays, case-insensitive', () => {
    const out = redact({ user: { Email: 'a@b.c', id: 'u_1' }, items: [{ Summary: 's', code: 'X' }] });
    expect(out).toEqual({ user: { Email: REDACTED, id: 'u_1' }, items: [{ Summary: REDACTED, code: 'X' }] });
  });

  it('keeps allowed field-name lists (fieldNames) intact', () => {
    expect(redact({ fieldNames: ['summary', 'phone'] })).toEqual({ fieldNames: ['summary', 'phone'] });
  });

  it('serializes errors without stack unless requested', () => {
    const err = new Error('boom');
    expect(redact({ error: err })).toEqual({ error: { name: 'Error', message: 'boom' } });
    expect((redact({ error: err }, true).error as { stack?: string }).stack).toBeDefined();
  });

  it('builds the documented entry shape and does not mutate input', () => {
    const ctx = { callId: 'c1', summary: 's' };
    const e = buildEntry('warn', 'callService.changeStatus.failed', ctx);
    expect(e).toMatchObject({ level: 'warn', event: 'callService.changeStatus.failed', context: { callId: 'c1', summary: REDACTED } });
    expect(Number.isNaN(Date.parse(e.at))).toBe(false);
    expect(ctx.summary).toBe('s');
  });

  it('writes to console with PII removed', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('x.failed', { email: 'a@b.c', code: 'E' });
    expect(spy).toHaveBeenCalledOnce();
    expect(JSON.stringify(spy.mock.calls[0])).not.toContain('a@b.c');
  });
});
