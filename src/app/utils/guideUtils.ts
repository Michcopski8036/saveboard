// Guides are the /guides/ local-content section: paired EN/KO markdown per post.
// Mirrors blogUtils, plus the two guide-only frontmatter fields (lang, board_url)
// and the language pairing that gives KO its own `-ko` URL.
export interface GuideMeta {
  title: string;
  date: string;
  description: string;
  /** Shared by both language files; the KO page renders at `/guides/<slug>-ko`. */
  slug: string;
  keywords: string;
  lang: 'en' | 'ko';
  boardUrl: string;
  /** Optional screenshot of this guide's own board; falls back to a generic app shot. */
  boardImage: string;
  /**
   * Optional own-app disclosure banner, rendered right after the intro (before
   * the first H2). All four fields are frontmatter (`promo_note`, `promo_text`,
   * `promo_cta`, `promo_url`); guides without them render exactly as before.
   */
  promoNote: string;
  promoText: string;
  promoCta: string;
  promoUrl: string;
  content: string;
}

export interface GuidePair {
  slug: string;
  date: string;
  en: GuideMeta;
  ko: GuideMeta;
}

function parseGuide(raw: string): GuideMeta {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const empty: GuideMeta = { title: '', date: '', description: '', slug: '', keywords: '', lang: 'en', boardUrl: '', boardImage: '', promoNote: '', promoText: '', promoCta: '', promoUrl: '', content: raw };
  if (!match) return empty;
  const data: Record<string, string> = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    data[line.slice(0, colon).trim()] = line.slice(colon + 1).trim().replace(/^"|"$/g, '');
  });
  return {
    title: data.title ?? '',
    date: data.date ?? '',
    description: data.description ?? '',
    slug: data.slug ?? '',
    keywords: data.keywords ?? '',
    lang: data.lang === 'ko' ? 'ko' : 'en',
    boardUrl: data.board_url ?? '',
    boardImage: data.board_image ?? '',
    promoNote: data.promo_note ?? '',
    promoText: data.promo_text ?? '',
    promoCta: data.promo_cta ?? '',
    promoUrl: data.promo_url ?? '',
    content: match[2].trim(),
  };
}

const rawModules = import.meta.glob('/src/guides/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const bySlug = new Map<string, { en?: GuideMeta; ko?: GuideMeta }>();
for (const raw of Object.values(rawModules)) {
  const guide = parseGuide(raw);
  if (!guide.slug) continue;
  const entry = bySlug.get(guide.slug) ?? {};
  entry[guide.lang] = guide;
  bySlug.set(guide.slug, entry);
}

// A post needs both languages to publish — same rule prerender-seo.mjs applies.
export const guidePairs: GuidePair[] = [...bySlug.entries()]
  .filter(([, pair]) => pair.en && pair.ko)
  .map(([slug, pair]) => ({ slug, date: pair.en!.date, en: pair.en!, ko: pair.ko! }))
  .sort((a, b) => b.date.localeCompare(a.date));

/**
 * Resolves a `/guides/:slug` URL segment. A trailing `-ko` selects the Korean
 * page, so a guide's own slug must not end in `-ko`.
 */
export function getGuideByRouteSlug(routeSlug: string): { guide: GuideMeta; pair: GuidePair } | undefined {
  const wantsKo = routeSlug.endsWith('-ko');
  const baseSlug = wantsKo ? routeSlug.slice(0, -3) : routeSlug;
  const pair = guidePairs.find(p => p.slug === baseSlug);
  if (!pair) return undefined;
  return { guide: wantsKo ? pair.ko : pair.en, pair };
}
