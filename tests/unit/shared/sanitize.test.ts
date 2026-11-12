import { describe, expect, it } from 'vitest';
import { htmlToText, sanitizeHtml } from '@/shared/sanitize';

describe('sanitizeHtml', () => {
  it('keeps editor formatting and tables', () => {
    const html = '<p><strong>a</strong> <em>b</em> <u>c</u> <s>d</s></p><ul><li>x</li></ul><table><tbody><tr><td colspan="2">t</td></tr></tbody></table>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('removes scripts, event handlers and javascript: URLs', () => {
    const out = sanitizeHtml('<p onclick="alert(1)">hi</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">l</a>');
    expect(out).not.toMatch(/<script|onerror|onclick|javascript:|<img/i);
    expect(out).toContain('hi');
  });

  it('drops style/iframe and unknown attributes', () => {
    const out = sanitizeHtml('<p style="color:red" class="x">a</p><iframe src="https://e.com"></iframe>');
    expect(out).toBe('<p>a</p>');
  });

  it('forces safe target/rel on links', () => {
    const out = sanitizeHtml('<a href="https://example.com" target="_self">l</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });

  it('is idempotent on mixed input', () => {
    const x = '<p>a<b onmouseover=x>b</b><a href="https://e.com">c</a><svg><script>1</script></svg></p>';
    expect(sanitizeHtml(sanitizeHtml(x))).toBe(sanitizeHtml(x));
  });
});

describe('htmlToText', () => {
  it('returns plain text with block spacing', () => {
    expect(htmlToText('<p>เครื่องพิมพ์</p><p>เสีย<br>ชั้น 3</p>')).toBe('เครื่องพิมพ์ เสีย ชั้น 3');
  });

  it('treats markup-only content as empty', () => {
    expect(htmlToText('<p></p><p><br></p>')).toBe('');
  });

  it('does not leak script content', () => {
    expect(htmlToText('<p>ok</p><script>alert(1)</script>')).toBe('ok');
  });
});
