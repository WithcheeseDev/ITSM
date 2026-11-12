/**
 * C13 Rich Text Sanitizer — allow-list of tags the Tiptap editor (StarterKit + Underline + Table) produces.
 * Used at render and at save (defense in depth).
 */
import DOMPurify from 'dompurify';
import { logger } from './logger';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre', 'blockquote',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'a',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'colgroup', 'col',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'colspan', 'rowspan', 'start'];

let hookInstalled = false;
function installHook(): void {
  if (hookInstalled) return;
  // Links: force safe target/rel so a note cannot open a tab with window.opener access
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  });
  hookInstalled = true;
}

const MAX_PASSES = 3;

function _sanitizeOnce(html: string): { clean: string; removed: number } {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#|\/)/i,
    // Non-URL attributes are otherwise tested against ALLOWED_URI_REGEXP too (colspan="2" would be dropped)
    ADD_URI_SAFE_ATTR: ['colspan', 'rowspan', 'start', 'target', 'rel'],
  });
  return { clean, removed: DOMPurify.removed.length };
}

/**
 * Malformed input (e.g. `<p><table><p>`) can serialize to markup the parser re-nests differently (`<p><p>…`),
 * so one pass is not idempotent (P12). Re-run until the output stops changing.
 */
export function sanitizeHtml(html: string): string {
  installHook();
  let { clean, removed } = _sanitizeOnce(html);
  for (let pass = 1; pass < MAX_PASSES; pass += 1) {
    const next = _sanitizeOnce(clean);
    removed += next.removed;
    if (next.clean === clean) break;
    clean = next.clean;
  }
  if (removed > 0) logger.debug('sanitize.removed', { removedCount: removed });
  return clean;
}

/** Plain text for empty checks and full-text search. Block boundaries become spaces. */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(sanitizeHtml(html), 'text/html');
  doc.querySelectorAll('br, p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, pre').forEach((el) => {
    el.append(' ');
  });
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
