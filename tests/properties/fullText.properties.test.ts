import fc from 'fast-check';
import { describe, it } from 'vitest';
import { matchFullText, toHaystack } from '@/features/search/fullText';

const RUNS = { numRuns: 200 };
// small alphabet so terms actually hit the text; lower case never collides with the AND / OR / NOT keywords
const word = fc.stringMatching(/^[a-dก-ข]{1,3}$/);
const haystack = fc.array(word, { maxLength: 12 }).map((ws) => toHaystack(...ws));

type Expr = { t: 'term'; w: string } | { t: 'not'; e: Expr } | { t: 'and' | 'or'; l: Expr; r: Expr };
const { expr } = fc.letrec<{ expr: Expr }>((tie) => ({
  expr: fc.oneof(
    { depthSize: 'small', withCrossShrink: true },
    word.map((w): Expr => ({ t: 'term', w })),
    tie('expr').map((e): Expr => ({ t: 'not', e })),
    fc.record({ t: fc.constantFrom('and' as const, 'or' as const), l: tie('expr'), r: tie('expr') }),
  ),
}));
const render = (e: Expr): string =>
  e.t === 'term' ? e.w : e.t === 'not' ? `NOT (${render(e.e)})` : `(${render(e.l)}) ${e.t.toUpperCase()} (${render(e.r)})`;
const truth = (e: Expr, h: string): boolean =>
  e.t === 'term' ? h.includes(e.w) : e.t === 'not' ? !truth(e.e, h) : e.t === 'and' ? truth(e.l, h) && truth(e.r, h) : truth(e.l, h) || truth(e.r, h);
const m = (q: string, h: string) => matchFullText(q, 'boolean', h);

describe('P11 full-text Boolean', () => {
  it('q1 AND q2 === q1 && q2', () => {
    fc.assert(fc.property(expr, expr, haystack, (a, b, h) => m(`(${render(a)}) AND (${render(b)})`, h) === (m(render(a), h) && m(render(b), h))), RUNS);
  });

  it('adjacent terms mean AND', () => {
    fc.assert(fc.property(expr, expr, haystack, (a, b, h) => m(`(${render(a)}) (${render(b)})`, h) === (m(render(a), h) && m(render(b), h))), RUNS);
  });

  it('q1 OR q2 === q1 || q2', () => {
    fc.assert(fc.property(expr, expr, haystack, (a, b, h) => m(`(${render(a)}) OR (${render(b)})`, h) === (m(render(a), h) || m(render(b), h))), RUNS);
  });

  it('NOT q === !q', () => {
    fc.assert(fc.property(expr, haystack, (a, h) => m(`NOT (${render(a)})`, h) === !m(render(a), h)), RUNS);
  });

  it('any rendered expression evaluates like the reference', () => {
    fc.assert(fc.property(expr, haystack, (e, h) => m(render(e), h) === truth(e, h)), RUNS);
  });

  it('Natural Language ignores case and needs every word', () => {
    fc.assert(
      fc.property(fc.array(word, { minLength: 1, maxLength: 4 }), haystack, (ws, h) => {
        const expected = ws.every((w) => h.includes(w));
        return matchFullText(ws.join(' ').toUpperCase(), 'natural', h) === expected && matchFullText(ws.join(' '), 'natural', h) === expected;
      }),
      RUNS,
    );
  });
});
