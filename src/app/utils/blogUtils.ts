export interface PostMeta {
  title: string;
  date: string;
  description: string;
  slug: string;
  /** Cornerstone landings render at top-level `/<route>`, not `/blog/<slug>`. */
  route: string;
  content: string;
}

function parseFrontmatter(raw: string): PostMeta {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { title: '', date: '', description: '', slug: '', route: '', content: raw };
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

export function formatDate(iso: string, lang: string = 'en'): string {
  const d = new Date(iso + 'T00:00:00');
  // A Korean page showing "30 July 2026" reads as a translated-badly page to a
  // reader and gives a crawler an English signal inside Korean content.
  // Mirrors formatDate() in scripts/prerender-seo.mjs — keep the two in step.
  return d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
}
