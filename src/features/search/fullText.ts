/**
 * US-021 Full-Text — pure functions (P11 property tests).
 * Natural Language: every word must appear (case-insensitive substring — Thai has no spaces between words).
 * Boolean: AND / OR / NOT (upper case), parentheses and "quoted phrases"; adjacent terms mean AND.
 * Lenient: a dangling operator or missing ")" is ignored instead of failing the search.
 */
export type FullTextMode = 'natural' | 'boolean';

type Node =
  | { kind: 'term'; value: string }
  | { kind: 'not'; node: Node }
  | { kind: 'and' | 'or'; left: Node; right: Node }
  | { kind: 'empty' };

const OPERATORS = new Set(['AND', 'OR', 'NOT', '(', ')']);

function tokenize(query: string): string[] {
  return query.match(/"[^"]*"|\(|\)|[^\s()"]+/g) ?? [];
}

const termValue = (token: string) => (token.startsWith('"') ? token.slice(1, -1) : token).toLowerCase();

/** Recursive descent: or → and (OR and)* · and → not ((AND)? not)* · not → NOT not | ( or ) | term */
export function parseBoolean(query: string): Node {
  const tokens = tokenize(query);
  let pos = 0;
  const peek = () => tokens[pos];

  function parseOr(): Node {
    let left = parseAnd();
    while (peek() === 'OR') {
      pos++;
      left = combine('or', left, parseAnd());
    }
    return left;
  }
  function parseAnd(): Node {
    let left = parseNot();
    while (pos < tokens.length && peek() !== 'OR' && peek() !== ')') {
      if (peek() === 'AND') pos++;
      left = combine('and', left, parseNot());
    }
    return left;
  }
  function parseNot(): Node {
    const t = peek();
    if (t === undefined) return { kind: 'empty' };
    if (t === 'NOT') {
      pos++;
      const node = parseNot();
      return node.kind === 'empty' ? node : { kind: 'not', node };
    }
    if (t === '(') {
      pos++;
      const node = parseOr();
      if (peek() === ')') pos++;
      return node;
    }
    if (OPERATORS.has(t)) {
      pos++; // stray AND / OR / ")" — skip
      return { kind: 'empty' };
    }
    pos++;
    const value = termValue(t);
    return value ? { kind: 'term', value } : { kind: 'empty' };
  }
  const combine = (kind: 'and' | 'or', left: Node, right: Node): Node =>
    left.kind === 'empty' ? right : right.kind === 'empty' ? left : { kind, left, right };

  const root = parseOr();
  // anything left after a stray ")" is ANDed on, so no part of the query is silently dropped
  return pos < tokens.length ? combine('and', root, parseBoolean(tokens.slice(pos + 1).join(' '))) : root;
}

function evaluate(node: Node, haystack: string): boolean {
  switch (node.kind) {
    case 'empty':
      return true;
    case 'term':
      return haystack.includes(node.value);
    case 'not':
      return !evaluate(node.node, haystack);
    case 'and':
      return evaluate(node.left, haystack) && evaluate(node.right, haystack);
    case 'or':
      return evaluate(node.left, haystack) || evaluate(node.right, haystack);
  }
}

/** `haystack` must already be lower-cased (see `toHaystack`). An empty query matches everything. */
export function matchFullText(query: string, mode: FullTextMode, haystack: string): boolean {
  if (!query.trim()) return true;
  if (mode === 'natural') {
    return query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => haystack.includes(w));
  }
  return evaluate(parseBoolean(query), haystack);
}

export const toHaystack = (...parts: string[]): string => parts.join(' ').toLowerCase();
