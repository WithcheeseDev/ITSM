import fc from 'fast-check';
import { describe, it } from 'vitest';
import { sanitizeHtml } from '@/shared/sanitize';

const RUNS = { numRuns: 200 };
const PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<a href="javascript:alert(1)">x</a>',
  '<a href=" JaVaScRiPt:alert(1)">x</a>',
  '<svg onload=alert(1)>',
  '<p onclick="alert(1)">p</p>',
  '<iframe src="javascript:alert(1)"></iframe>',
  '<a href="https://example.com" onmouseover="x()">ok</a>',
  '<table><tr><td colspan="2" onfocus="x()">c</td></tr></table>',
  '<scr<script>ipt>alert(1)</script>',
  '<style>body{}</style>',
  '<p>ปกติ <strong>ตัวหนา</strong></p>',
];
const SAFE_TAGS = ['p', 'strong', 'em', 'u', 'ul', 'li', 'a href="https://example.com"', 'table', 'td'];
const html = fc
  .array(fc.oneof(fc.constantFrom(...PAYLOADS), fc.string(), fc.constantFrom(...SAFE_TAGS).map((t) => `<${t}>`), fc.constantFrom('</p>', '</a>', '"', "'", '<', '>')), { maxLength: 12 })
  .map((parts) => parts.join(''));

/** Parse the output and look for anything that can run script. */
function isSafe(out: string): boolean {
  if (/<script/i.test(out)) return false;
  const doc = new DOMParser().parseFromString(out, 'text/html');
  for (const el of doc.body.querySelectorAll('*')) {
    if (['SCRIPT', 'IFRAME', 'SVG', 'STYLE', 'IMG'].includes(el.tagName.toUpperCase())) return false;
    for (const attr of el.attributes) {
      if (/^on/i.test(attr.name)) return false;
      if (/^\s*javascript:/i.test(attr.value)) return false;
    }
  }
  return true;
}

describe('P12 sanitizer', () => {
  it('is idempotent', () => {
    fc.assert(fc.property(html, (x) => sanitizeHtml(sanitizeHtml(x)) === sanitizeHtml(x)), RUNS);
  });

  it('never outputs script, on* attributes or javascript: URLs', () => {
    fc.assert(fc.property(html, (x) => isSafe(sanitizeHtml(x))), RUNS);
  });
});
