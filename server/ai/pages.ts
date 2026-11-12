/** Page guide search for the AI Assist agent (integration.md Add-on "Page guide + searchPages"): MiniSearch over pages.json. */
import MiniSearch from 'minisearch';
import guide from './pages.json';

export interface PageParam {
  name: string;
  in: string;
  pattern: string;
  description: string;
}
export interface PageHit {
  route: string;
  title: string;
  purpose: string;
  params: PageParam[];
}

const MAX_HITS = 3;
const segmenter = new Intl.Segmenter('th', { granularity: 'word' });

/** Thai has no spaces between words: split with Intl.Segmenter (also splits English on spaces/punctuation). */
export function tokenize(text: string): string[] {
  return [...segmenter.segment(text.toLowerCase())].filter((s) => s.isWordLike).map((s) => s.segment);
}

const navigable = guide.pages.filter((p) => p.aiNavigable);

export const NAVIGABLE_ROUTES: ReadonlySet<string> = new Set(navigable.map((p) => p.route));

const index = new MiniSearch({
  idField: 'route',
  fields: ['title', 'purpose', 'keywords', 'examples'],
  storeFields: ['route', 'title', 'purpose', 'params'],
  tokenize,
  searchOptions: { boost: { title: 2, keywords: 2 }, prefix: true, fuzzy: 0.2, combineWith: 'OR', tokenize },
});
index.addAll(
  navigable.map((p) => ({
    route: p.route,
    title: `${p.title.th} ${p.title.en}`,
    purpose: p.purpose,
    keywords: [...p.keywords.th, ...p.keywords.en].join(' '),
    examples: p.examples.join(' '),
    params: p.params,
  })),
);

/** Up to 3 navigable pages that best answer the query; [] when nothing matches. */
export function searchPages(query: string): PageHit[] {
  return index
    .search(query)
    .slice(0, MAX_HITS)
    .map((r) => ({ route: r.route as string, title: r.title as string, purpose: r.purpose as string, params: r.params as PageParam[] }));
}
