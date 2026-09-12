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
   * the first H2). All fields are frontmatter (`promo_note` disclosure eyebrow,
   * `promo_title` headline, `promo_text` body, `promo_cta`/`promo_url` button,
   * `promo_image`/`promo_image_alt`/`promo_image_w`/`promo_image_h` hero shot,
   * `promo_fine` small print); guides without them render exactly as before.
   */
  promoNote: string;
  promoTitle: string;
  promoText: string;
  promoCta: string;
  promoUrl: string;
  promoImage: string;
  promoImageAlt: string;
  promoImageW: string;
  promoImageH: string;
  /** Optional `promo_image_bg` — the field behind the shot. Defaults to the
   *  theme's; set it when the image's own edges are a different colour
   *  (CourtClock's is near-black, SaveBoard's is cream) or you get bars. */
  promoImageBg: string;
  promoFine: string;
  /** Optional `promo_theme` — "rose" restyles the card in PeriodVol's palette; absent = SaveBoard purple. */
  promoTheme: string;
  content: string;
}

/**
 * A guide is published in whichever languages it actually has a file for.
 * Both sides are optional: a Korean-only guide exists at `/guides/<slug>-ko`
 * with no English counterpart, and the UI must not invent the missing URL.
 * Mirrors the same rule in scripts/prerender-seo.mjs.
 */
export interface GuidePair {
  slug: string;
  date: string;
  en?: GuideMeta;
  ko?: GuideMeta;
}

function parseGuide(raw: string): GuideMeta {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  const empty: GuideMeta = { title: '', date: '', description: '', slug: '', keywords: '', lang: 'en', boardUrl: '', boardImage: '', promoNote: '', promoTitle: '', promoText: '', promoCta: '', promoUrl: '', promoImage: '', promoImageAlt: '', promoImageW: '', promoImageH: '', promoImageBg: '', promoFine: '', promoTheme: '', content: raw };
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
    promoTitle: data.promo_title ?? '',
    promoText: data.promo_text ?? '',
    promoCta: data.promo_cta ?? '',
    promoUrl: data.promo_url ?? '',
    promoImage: data.promo_image ?? '',
    promoImageAlt: data.promo_image_alt ?? '',
    promoImageW: data.promo_image_w ?? '',
    promoImageH: data.promo_image_h ?? '',
    promoImageBg: data.promo_image_bg ?? '',
    promoFine: data.promo_fine ?? '',
    promoTheme: data.promo_theme ?? '',
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

// One language is enough to publish — same rule prerender-seo.mjs applies.
// Requiring both used to make Korean-only guides disappear from the app while
// the prerendered HTML still existed: the crawler saw the page, a reader got
// redirected to /guides.
export const guidePairs: GuidePair[] = [...bySlug.entries()]
  .filter(([, pair]) => pair.en || pair.ko)
  .map(([slug, pair]) => ({ slug, date: (pair.en ?? pair.ko)!.date, en: pair.en, ko: pair.ko }))
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
  // Asking for a language this guide was never written in is a miss, not an
  // empty page — the caller redirects to the index.
  const guide = wantsKo ? pair.ko : pair.en;
  if (!guide) return undefined;
  return { guide, pair };
}

/**
 * 가이드에서 나가는 링크에 `?src=guide-<슬러그>`를 붙인다.
 *
 * 가이드는 앱과 **같은 도메인**(saveboard.app)에 있다. 그래서 가이드에서 앱으로
 * 넘어가는 클릭은 referrer가 같은 출처라 'direct'로 떨어지고, 어느 가이드가
 * 사람을 데려왔는지 영영 알 수 없었다(2026-09-12 확인 — 가이드 유입 0건).
 * CourtClock이 `?utm_source=courtclock`으로 이미 잡히고 있는 것과 같은 방식이다.
 *
 * 이미 utm_source나 src가 붙어 있으면 건드리지 않는다 — 손으로 정한 값이 이긴다.
 */
export function withGuideSrc(url: string, slug: string): string {
  if (!url) return url;
  try {
    const u = new URL(url, 'https://www.saveboard.app');
    if (u.searchParams.has('utm_source') || u.searchParams.has('src')) return url;
    u.searchParams.set('src', `guide-${slug}`.slice(0, 60));
    return u.toString();
  } catch {
    return url; // 파싱 안 되는 주소는 그대로 둔다
  }
}
