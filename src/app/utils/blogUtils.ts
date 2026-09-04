export interface PostMeta {
  title: string;
  date: string;
  description: string;
  slug: string;
  /** Cornerstone landings render at top-level `/<route>`, not `/blog/<slug>`. */
  route: string;
  /** 'ko' for the Korean product pages; everything else is English. */
  lang: 'en' | 'ko';
  /** Site-relative path of the same page in the other language, or ''. */
  altLangUrl: string;
  content: string;
}

function parseFrontmatter(raw: string): PostMeta {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { title: '', date: '', description: '', slug: '', route: '', lang: 'en', altLangUrl: '', content: raw };
  const data: Record<string, string> = {};
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':');
    if (colon === -1) return;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^"|"$/g, '');
    data[key] = val;
  });
  return {
    title: data.title ?? '',
    date: data.date ?? '',
    description: data.description ?? '',
    slug: data.slug ?? '',
    route: data.route ?? '',
    lang: data.lang === 'ko' ? 'ko' : 'en',
    altLangUrl: data.alt_lang_url ?? '',
    content: match[2].trim(),
  };
}

const rawModules = import.meta.glob('/src/blog/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const allPosts: PostMeta[] = Object.values(rawModules)
  .map(raw => parseFrontmatter(raw))
  .filter(p => p.slug)
  .sort((a, b) => b.date.localeCompare(a.date));

// Mirrors scripts/prerender-seo.mjs: pages with a `route` render at top-level
// `/<route>`, the rest at `/blog/<slug>`.
export const landingPages: PostMeta[] = allPosts.filter(p => p.route);
export const blogPosts: PostMeta[] = allPosts.filter(p => !p.route);

export function getPostBySlug(slug: string): PostMeta | undefined {
  return allPosts.find(p => p.slug === slug);
}

/**
 * Korean landings are rendered by a real route in main.tsx rather than falling
 * through to <App/>. Without that, a human (and a JS-rendering crawler) landing
 * on /pocket-alternative-ko sees the app's marketing page, not the article the
 * prerendered HTML promises.
 */
export function getPostByRoute(route: string): PostMeta | undefined {
  return allPosts.find(p => p.route === route);
}

/** Landings that need their own React route — see getPostByRoute. */
export const koLandingPages: PostMeta[] = landingPages.filter(p => p.lang === 'ko');

export function formatDate(iso: string, lang: string = 'en'): string {
  const d = new Date(iso + 'T00:00:00');
  // A Korean page showing "30 July 2026" reads as a translated-badly page to a
  // reader and gives a crawler an English signal inside Korean content.
  // Mirrors formatDate() in scripts/prerender-seo.mjs — keep the two in step.
  return d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
}
