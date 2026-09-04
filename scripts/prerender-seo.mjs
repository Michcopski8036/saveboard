import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const blogDir = path.join(root, 'src', 'blog');
const guidesDir = path.join(root, 'src', 'guides');
const baseUrl = 'https://www.saveboard.app';
const siteName = 'SaveBoard';
const ogImage = `${baseUrl}/og-image.png`;

// The promo card's frontmatter, shared by guides, blog posts and landings.
// Declared up here on purpose: parsePost() runs at module load (line below), so
// a const further down the file would still be in its temporal dead zone.
// One reader, one set of keys — a page that omits them gets '' everywhere and
// renders no card at all.
const PROMO_KEYS = {
  promo_note: 'promoNote',
  promo_title: 'promoTitle',
  promo_text: 'promoText',
  promo_cta: 'promoCta',
  promo_url: 'promoUrl',
  promo_image: 'promoImage',
  promo_image_alt: 'promoImageAlt',
  promo_image_w: 'promoImageW',
  promo_image_h: 'promoImageH',
  promo_fine: 'promoFine',
  promo_theme: 'promoTheme',
};
const PROMO_DEFAULTS = Object.fromEntries(Object.values(PROMO_KEYS).map(field => [field, '']));

const template = await readFile(path.join(distDir, 'index.html'), 'utf8');
const files = (await readdir(blogDir)).filter(file => file.endsWith('.md'));
const allPosts = (await Promise.all(files.map(async file => parsePost(await readFile(path.join(blogDir, file), 'utf8')))))
  .filter(post => post.slug)
  .sort((a, b) => b.date.localeCompare(a.date));

// Pages with a `route` frontmatter render at a top-level URL (e.g. /pocket-alternative)
// — better for SEO/AEO than /blog/* for cornerstone landing pages. The rest are blog posts.
const landings = allPosts.filter(post => post.route);
const posts = allPosts.filter(post => !post.route);
// The blog index and its Blog JSON-LD are English. A Korean post would show up
// there as a Korean title inside an English list with no Korean index to sit in,
// so it is prerendered and put in the sitemap but left out of the index.
const indexPosts = posts.filter(post => post.lang !== 'ko');

const guideFiles = (await readdir(guidesDir).catch(() => [])).filter(f => /\.(en|ko)\.md$/.test(f));
const guidesBySlug = new Map();
for (const file of guideFiles) {
  const langMatch = file.match(/\.(en|ko)\.md$/);
  const lang = langMatch[1];
  const slug = file.slice(0, -`.${lang}.md`.length);
  const guide = parseGuide(await readFile(path.join(guidesDir, file), 'utf8'), lang);
  guide.slug = slug;
  if (!guidesBySlug.has(slug)) guidesBySlug.set(slug, {});
  guidesBySlug.get(slug)[lang] = guide;
}
const guidePairs = [...guidesBySlug.entries()]
  .filter(([slug, pair]) => {
    if (!pair.en || !pair.ko) {
      console.error(`prerender-seo: guide "${slug}" is missing its ${pair.en ? 'ko' : 'en'} pair — skipping.`);
      return false;
    }
    return true;
  })
  .map(([, pair]) => pair)
  .sort((a, b) => b.en.date.localeCompare(a.en.date));

await writeRoute('blog', blogIndexHtml());
for (const post of posts) {
  await writeRoute(`blog/${post.slug}`, articleHtml(post, { canonical: `${baseUrl}/blog/${post.slug}`, isLanding: false }));
}
for (const page of landings) {
  await writeRoute(page.route, articleHtml(page, { canonical: `${baseUrl}/${page.route}`, isLanding: true }));
}

await writeRoute('guides', guideIndexHtml('en'));
await writeRoute('guides-ko', guideIndexHtml('ko'));
for (const pair of guidePairs) {
  await writeRoute(`guides/${pair.en.slug}`, guideHtml(pair.en, pair.ko));
  await writeRoute(`guides/${pair.en.slug}-ko`, guideHtml(pair.ko, pair.en));
}

await writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml(), 'utf8');

function parsePost(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { title: '', date: '', description: '', slug: '', keywords: '', content: raw.trim() };

  const data = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^"|"$/g, '');
    data[key] = val;
  }

  return {
    title: data.title ?? '',
    date: data.date ?? '',
    description: data.description ?? '',
    slug: data.slug ?? '',
    keywords: data.keywords ?? '',
    route: data.route ?? '',
    // Blog posts and landings take the same promo_* card the guides use — same
    // keys, same renderer (promoHtml). A page without them renders as before.
    ...PROMO_DEFAULTS,
    ...extractPromoFrontmatter(raw),
    // Guides pair languages by filename suffix; blog/landing pages have no such
    // pair, so the language and its counterpart URL are declared in frontmatter.
    // Without `lang`, every Korean page would ship as <html lang="en">.
    lang: data.lang === 'ko' ? 'ko' : 'en',
    // `alt_lang_url` is the site-relative path of the same page in the other
    // language ("/pocket-alternative"). Both sides must declare each other —
    // a one-way hreflang is ignored.
    altLangUrl: data.alt_lang_url ?? '',
    content: match[2].trim(),
  };
}

// hreflang pair for a blog/landing page that declares `alt_lang_url`.
// Pages without it get no alternates, exactly as before.
function postAlternates(page, canonical) {
  if (!page.altLangUrl) return [];
  const other = page.altLangUrl.startsWith('http') ? page.altLangUrl : `${baseUrl}${page.altLangUrl}`;
  const en = page.lang === 'ko' ? other : canonical;
  const ko = page.lang === 'ko' ? canonical : other;
  return [
    { hreflang: 'en', href: en, locale: 'en_AU' },
    { hreflang: 'ko', href: ko, locale: 'ko_KR' },
    { hreflang: 'x-default', href: en },
  ];
}

// Guides reuse parsePost's frontmatter parser, then add the two guide-only
// fields and the language pairing implied by the filename suffix.
function parseGuide(raw, lang) {
  const post = parsePost(raw);
  // list_type decides what each list entry *is* in structured data. Places get
  // Restaurant + PostalAddress; everything else is a Thing with a name and a
  // link, because marking software up as a restaurant with a street address is
  // simply false.
  // promo_* defaults and values already come through parsePost — the guides and
  // the blog read the identical frontmatter keys.
  return { ...post, lang, boardUrl: '', boardImage: '', listType: 'place', ...extractGuideFrontmatter(raw) };
}

function extractGuideFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^"|"$/g, '');
    if (key === 'lang') data.lang = val;
    if (key === 'board_url') data.boardUrl = val;
    if (key === 'board_image') data.boardImage = val;
    if (key === 'list_type')   data.listType   = val;
  }
  return { ...data, ...extractPromoFrontmatter(raw) };
}

function extractPromoFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    if (!PROMO_KEYS[key]) continue;
    data[PROMO_KEYS[key]] = line.slice(colon + 1).trim().replace(/^"|"$/g, '');
  }
  return data;
}

// Parses "## The List" / "## 리스트" numbered items: "1. **Name** (address) — note"
function extractListItems(md) {
  const items = [];
  // "1. **Name** ★ 4.3 · 1,017 reviews (address) — note". The rating segment
  // between the name and the address is optional and must stay paren-free, or
  // it would be picked up as the address.
  const re = /^\d+\.\s+\*\*(.+?)\*\*\s*(★[^()]*)?\(([^)]+)\)\s*(?:—|-)?\s*(.*)$/gm;
  let m;
  while ((m = re.exec(md))) {
    // The name may itself be a link — "**[Name](url)**" — so the venue's own
    // site becomes the LocalBusiness url instead of ending up inside its name.
    const rawName = m[1].trim();
    const link = rawName.match(/^\[(.+?)\]\((.+?)\)$/);
    items.push({
      name: link ? link[1].trim() : rawName,
      url: link ? link[2].trim() : '',
      rating: (m[2] || '').trim(),
      address: m[3].trim(),
      note: m[4].trim(),
    });
  }
  return items;
}

// A place guide without star ratings is the one gap a reader notices first, and
// it can't be fixed after the fact without re-reading every venue's profile.
// Every business has a Google rating, so a missing one means it wasn't looked
// up — fail the build rather than publish the list without it. Software and
// reference lists are exempt: plenty of those items have no rating anywhere.
function assertPlaceRatings(guide, items) {
  if (guide.listType !== 'place') return;
  const missing = items.filter(i => !i.rating).map(i => i.name);
  if (!missing.length) return;
  throw new Error(
    `${guide.slug}.${guide.lang}.md: ${missing.length} of ${items.length} places have no "★ rating · review count".\n` +
    `  Missing: ${missing.join(', ')}\n` +
    `  Read each one off its own Google Business Profile and write it between the name and the address:\n` +
    `    1. **[Name](url)** ★ 4.4 · 3,592 reviews (address) — write-up.\n` +
    `  Google Maps needs a real browser — curl and WebFetch only get the JS shell — so this can't be\n` +
    `  done from the weekly cloud routine. Place guides are written in a session that has one.`
  );
}

async function writeRoute(route, html) {
  const dir = path.join(distDir, route);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html, 'utf8');
}

/**
 * `alternates` are hreflang pairs — bilingual guides need them so Google serves
 * the Korean page to Korean searchers instead of treating the two as duplicates.
 * `image`, `locale` and the article timestamps are optional per-page overrides.
 */
function withSeo({ title, description, canonical, keywords = '', jsonLd = [], alternates = [], image = ogImage, locale = '', published = '', modified = '' }, bodyHtml) {
  const fullTitle = title.includes(siteName) ? title : `${title} — ${siteName}`;
  const isArticle = jsonLd.some(item => item['@type'] === 'Article');
  const meta = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    keywords ? `<meta name="keywords" content="${esc(keywords)}" />` : '',
    `<meta name="author" content="${siteName}" />`,
    `<meta name="theme-color" content="#A259FF" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    ...alternates.map(alt => `<link rel="alternate" hreflang="${esc(alt.hreflang)}" href="${esc(alt.href)}" />`),
    `<meta property="og:type" content="${isArticle ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    locale ? `<meta property="og:locale" content="${esc(locale)}" />` : '',
    ...alternates
      .filter(alt => alt.locale && alt.locale !== locale)
      .map(alt => `<meta property="og:locale:alternate" content="${esc(alt.locale)}" />`),
    isArticle && published ? `<meta property="article:published_time" content="${esc(published)}" />` : '',
    isArticle && modified ? `<meta property="article:modified_time" content="${esc(modified)}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:url" content="${esc(canonical)}" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ...jsonLd.map(item => `<script type="application/ld+json">${JSON.stringify(item)}</script>`),
  ].filter(Boolean).join('\n    ');

  // The template is <html lang="en">. Without this, every Korean page ships
  // claiming to be English — the most basic language signal a crawler reads,
  // and the one Naver's Korean index is most likely to weigh.
  const htmlLang = locale ? locale.replace('_', '-') : '';

  return template
    .replace(/<html lang="[^"]*"/, htmlLang ? `<html lang="${esc(htmlLang)}"` : '$&')
    .replace(/<title>[\s\S]*?<!-- Favicon -->/, `${meta}\n\n    <!-- Favicon -->`)
    .replace(/\s*<!-- Open Graph -->[\s\S]*?<!-- JSON-LD structured data -->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
    .replace(/<h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect\(0,0,0,0\);white-space:nowrap">[\s\S]*?<\/h1>/, `<h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap">${esc(fullTitle)}</h1>`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${bodyHtml}</div>`);
}

function blogIndexHtml() {
  const title = 'Blog — SaveBoard';
  const description = 'Tips, guides, and updates from the SaveBoard team. Learn how to save and organise links from group chats, WhatsApp, and more.';
  const canonical = `${baseUrl}/blog`;
  const body = `
    <main class="seo-page">
      <h1>SaveBoard Blog</h1>
      <p>${esc(description)}</p>
      <section>
        ${indexPosts.map(post => `
          <article>
            <p><time datetime="${esc(post.date)}">${esc(formatDate(post.date))}</time></p>
            <h2><a href="/blog/${esc(post.slug)}">${esc(post.title)}</a></h2>
            <p>${esc(post.description)}</p>
          </article>
        `).join('')}
      </section>
      ${relatedLandingsHtml()}
    </main>`;

  return withSeo({
    title,
    description,
    canonical,
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'SaveBoard Blog',
      url: canonical,
      description,
      publisher: organization(),
      blogPost: indexPosts.map(post => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: `${baseUrl}/blog/${post.slug}`,
        datePublished: post.date,
        dateModified: post.date,
        description: post.description,
      })),
    }],
  }, body);
}

// Cornerstone landings are excluded from the post list, which left them with no incoming
// internal links at all — Google discovered them from the sitemap but kept deprioritising
// the crawl. This block links them from the blog index and from every article.
function relatedLandingsHtml(excludeRoute = '', lang = 'en') {
  // Korean pages list Korean landings and vice versa: a Korean reader has no
  // use for "Compare SaveBoard" in English, and mixing the two would put a
  // Korean-language link block on every English page.
  const related = landings.filter(page => page.route !== excludeRoute && page.lang === lang);
  if (!related.length) return '';
  return `
      <section>
        <h2>${lang === 'ko' ? '함께 보면 좋은 페이지' : 'Compare SaveBoard'}</h2>
        <ul>
          ${related.map(page => `<li><a href="/${esc(page.route)}">${esc(page.title)}</a></li>`).join('')}
        </ul>
      </section>`;
}

function articleHtml(post, { canonical, isLanding }) {
  const ko = post.lang === 'ko';
  const content = post.content.replace(new RegExp(`^#\\s+${escapeRegExp(post.title)}\\s*\\n+`), '');
  // Promo card (promo_* frontmatter) sits after the intro and before the first
  // H2 — the same place guideHtml() puts it, via the same promoHtml(). Never at
  // the very top or the very bottom. Posts without the frontmatter are untouched.
  const promoSplit = post.promoUrl && post.promoText ? content.match(/\n(?=##\s)/) : null;
  if (post.promoUrl && post.promoText && !promoSplit) {
    console.error(`prerender-seo: "${post.slug}" has promo_* frontmatter but no H2 to sit after — card not rendered.`);
  }
  const article = promoSplit
    ? markdownToHtml(content.slice(0, promoSplit.index).trim()) + promoHtml(post) + markdownToHtml(content.slice(promoSplit.index).trim())
    : markdownToHtml(content);
  const faqs = extractFaq(content);
  const backLink = isLanding ? '' : `<p><a href="/blog">${ko ? '전체 글' : 'All articles'}</a></p>`;
  // Korean pages hand off to the Korean hub (/guides-ko), not the English blog —
  // the blog index and every post on it are English.
  const footLink = isLanding
    ? (ko
        ? '<p><a href="/guides-ko">SaveBoard 가이드 보기</a></p>'
        : '<p><a href="/blog">Read the SaveBoard blog</a></p>')
    : '';
  const body = `
    <main class="seo-page">
      <article>
        ${backLink}
        <header>
          <p><time datetime="${esc(post.date)}">${esc(formatDate(post.date, post.lang))}</time></p>
          <h1>${esc(post.title)}</h1>
          <p>${esc(post.description)}</p>
        </header>
        ${article}
      </article>
      ${relatedLandingsHtml(post.route, post.lang)}
      ${footLink}
    </main>`;

  const jsonLd = [{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    url: canonical,
    image: ogImage,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: ko ? 'ko-KR' : 'en-AU',
    author: { '@type': 'Organization', name: siteName },
    publisher: organization(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  }];
  // FAQPage schema — pulled into Google AI Overviews / Perplexity / ChatGPT answers (AEO).
  if (faqs.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    });
  }

  return withSeo({
    // Korean brand suffix stops at "— SaveBoard" (12 chars) — same reason as the
    // guides: Naver recommends a 40-character title and "Blog"/"가이드" only
    // eats into the descriptive part that earns the click.
    title: isLanding ? post.title : `${post.title} — SaveBoard${ko ? '' : ' Blog'}`,
    description: post.description,
    keywords: post.keywords,
    canonical,
    jsonLd,
    alternates: postAlternates(post, canonical),
    // An English page only declares a locale when it has a Korean counterpart:
    // og:locale:alternate is meaningless without og:locale, and setting it on
    // the unpaired English pages would relabel <html lang> across the whole
    // existing site for no gain.
    locale: ko ? 'ko_KR' : (post.altLangUrl ? 'en_AU' : ''),
    // article: timestamps are new, so they go on the new pages only — the point
    // of this change set is to add Korean pages, not to re-cut the English ones.
    published: ko ? post.date : '',
    modified: ko ? post.date : '',
  }, body);
}

function guideHtml(guide, otherLang) {
  const content = guide.content.replace(new RegExp(`^#\\s+${escapeRegExp(guide.title)}\\s*\\n+`), '');
  // Same order as the app page: list, then the board link, then the FAQ.
  const faqSplit = content.match(/\n(?=##\s+(?:FAQ|Frequently Asked Questions|자주 묻는 질문))/i);
  const preFaq = faqSplit ? content.slice(0, faqSplit.index).trim() : content;
  // Own-app disclosure banner (promo_* frontmatter) goes right after the intro,
  // before the first H2 — same placement as GuidePostPage.tsx. Guides without
  // the frontmatter render exactly as before.
  const introSplit = guide.promoUrl && guide.promoText ? preFaq.match(/\n(?=##\s)/) : null;
  const article = introSplit
    ? markdownToHtml(preFaq.slice(0, introSplit.index).trim()) + promoHtml(guide) + markdownToHtml(preFaq.slice(introSplit.index).trim())
    : markdownToHtml(preFaq);
  const faqArticle = faqSplit ? markdownToHtml(content.slice(faqSplit.index).trim()) : '';
  const faqs = extractFaq(content);
  const items = extractListItems(content);
  assertPlaceRatings(guide, items);
  const enUrl = `${baseUrl}/guides/${otherLang && guide.lang === 'ko' ? otherLang.slug : guide.slug}`;
  const koSlug = guide.lang === 'ko' ? guide.slug : (otherLang ? otherLang.slug : guide.slug);
  const canonical = guide.lang === 'ko' ? `${baseUrl}/guides/${koSlug}-ko` : `${baseUrl}/guides/${guide.slug}`;
  const otherHref = guide.lang === 'ko' ? `/guides/${koSlug}` : `/guides/${koSlug}-ko`;
  const otherLabel = guide.lang === 'ko' ? 'English' : '한국어';

  // Same ad copy as the app page's board card (GuidePostPage.tsx) — keep the
  // two in step when either changes.
  const boardKo = guide.lang === 'ko';
  const boardCta = guide.boardUrl
    ? `<aside aria-label="${boardKo ? '광고' : 'Advertisement'}" style="margin:24px 0;padding:20px;border:2px solid #e9d5ff;border-radius:16px;background:#faf5ff;max-width:680px">
        <img src="${escAttr(guide.boardImage || '/guides/shared-board-app.jpg')}" loading="lazy"
          alt="${boardKo ? '이 리스트의 보드를 휴대폰에서 연 화면' : 'This guide&#39;s board open on a phone'}"
          style="display:block;width:176px;border-radius:12px;margin:0 0 16px" />
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9333ea;margin:0 0 8px"><strong>${boardKo ? '이 리스트를 SaveBoard 보드로' : 'This list as a SaveBoard board'}</strong></p>
        <p style="font-size:20px;font-weight:700;margin:0 0 10px">${boardKo ? '링크 하나하나 확인하기 번거로우시죠?' : 'Tired of checking links one by one?'}</p>
        <p style="margin:0 0 16px">${boardKo
          ? '이 페이지의 모든 링크를 한번에 한곳에 모아 보세요. 전부 SaveBoard 보드 하나에 비주얼 카드로 정리돼 있어요 — 로그인 없이 열리고, 내 보드로 가져가면 다음에 다시 검색하지 않아도 돼요.'
          : 'See every link on this page in one go — they&#39;re all on a single SaveBoard board, laid out as visual cards. It opens without a login, and if you copy it to your own board you won&#39;t be searching for these again.'}</p>
        <p style="margin:0"><a href="${escAttr(guide.boardUrl)}" style="display:inline-block;padding:12px 24px;background:linear-gradient(90deg,#A259FF,#FF7262);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35);border-radius:12px;font-weight:700;text-decoration:none">${boardKo ? '모든 링크 한곳에서 열기' : 'Open all the links in one place'} →</a></p>
      </aside>`
    : '';

  const body = `
    <main class="seo-page">
      <article>
        <p><a href="${guide.lang === 'ko' ? '/guides-ko' : '/guides'}">${guide.lang === 'ko' ? '전체 가이드' : 'All guides'}</a> · <a href="${escAttr(otherHref)}">${otherLabel}</a></p>
        <header>
          <p><time datetime="${esc(guide.date)}">${esc(formatDate(guide.date, guide.lang))}</time></p>
          <h1>${esc(guide.title)}</h1>
          <p>${esc(guide.description)}</p>
        </header>
        ${article}
        ${boardCta}
        ${faqArticle}
      </article>
    </main>`;

  // Social cards are landscape (1.91:1); the board screenshot is a portrait
  // phone shot and would be centre-cropped to a meaningless slice, so sharing
  // uses the site card. board_image stays an on-page asset.
  const guideImage = ogImage;
  const enHref = `${baseUrl}/guides/${guide.lang === 'ko' ? koSlug : guide.slug}`;
  const koHref = `${baseUrl}/guides/${koSlug}-ko`;
  const alternates = [
    { hreflang: 'en', href: enHref, locale: 'en_AU' },
    { hreflang: 'ko', href: koHref, locale: 'ko_KR' },
    { hreflang: 'x-default', href: enHref },
  ];

  const jsonLd = [{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url: canonical,
    image: guideImage,
    datePublished: guide.date,
    dateModified: guide.date,
    inLanguage: guide.lang === 'ko' ? 'ko-KR' : 'en-AU',
    keywords: guide.keywords,
    isAccessibleForFree: true,
    author: { '@type': 'Organization', name: siteName },
    publisher: organization(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  }, {
    // Breadcrumbs give the guides section its own rung in search results
    // instead of every post looking like a loose page under the domain.
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteName, item: baseUrl },
      { '@type': 'ListItem', position: 2, name: guide.lang === 'ko' ? '가이드' : 'Guides', item: `${baseUrl}/guides` },
      { '@type': 'ListItem', position: 3, name: guide.title, item: canonical },
    ],
  }];
  if (items.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: guide.listType === 'place'
          ? {
              '@type': 'Restaurant',
              name: item.name,
              address: { '@type': 'PostalAddress', streetAddress: item.address, addressCountry: 'AU' },
              description: item.note,
              ...(item.url ? { url: item.url } : {}),
            }
          : {
              // The parenthesised text is a qualifier here ("free, login required"),
              // not an address, so it belongs in the description.
              '@type': guide.listType === 'software' ? 'SoftwareApplication' : 'Thing',
              name: item.name,
              description: [item.address, item.note].filter(Boolean).join(' — '),
              ...(item.url ? { url: item.url } : {}),
              ...(guide.listType === 'software' ? { applicationCategory: 'WebApplication' } : {}),
            },
      })),
    });
  }
  if (faqs.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    });
  }

  return withSeo({
    // 한국어는 브랜드 접미를 'SaveBoard'까지만 — 네이버 제목 권장이 40자인데
    // '가이드'까지 붙이면 서술형 제목이 잘리는 자리가 그만큼 앞당겨진다.
    // 제목 자체는 줄이지 않는다: GSC에서 클릭을 만든 게 그 서술부다(korean bbq 8위).
    title: guide.lang === 'ko' ? `${guide.title} — SaveBoard` : `${guide.title} — SaveBoard Guides`,
    description: guide.description,
    keywords: guide.keywords,
    canonical,
    jsonLd,
    alternates,
    image: guideImage,
    locale: guide.lang === 'ko' ? 'ko_KR' : 'en_AU',
    published: guide.date,
    modified: guide.date,
  }, body);
}

// Prerendered pages carry no stylesheet for #root content, so the banner uses
// inline styles — it only shows to crawlers and in the pre-hydration flash;
// human readers get the Tailwind version in GuidePostPage.tsx.
function promoHtml(guide) {
  // Mirrors PROMO_THEMES in GuidePostPage.tsx: default = SaveBoard purple,
  // rose = PeriodVol's palette.
  // rose = PeriodVol 팔레트. CTA는 무토 #8A5A6B — 2026-09-04 누나 확정(빨강 #D23B26을
  // 화면에서 보고 되돌림). 배경·테두리와 톤이 가까운 편이니 대비는 흰 글자와
  // 둥근 채움면이 감당한다. 색을 다시 세게 바꾸려면 누나에게 먼저 물을 것.
  const theme = guide.promoTheme === 'rose'
    ? { border: '#EBDED7', bg: '#FBF7F4', eyebrow: '#8A5A6B', cta: '#8A5A6B' }
    // ⛔ 보라 테마 CTA는 #A259FF 그대로. 무토는 **PeriodVol(로즈) 전용**이다
    // — 2026-09-04에 잠깐 전부 무토로 통일했다가 누나가 되돌렸다. 다시 통일하지 말 것.
    : { border: '#e9d5ff', bg: '#faf5ff', eyebrow: '#9333ea', cta: '#A259FF' };
  const img = guide.promoImage
    ? `<div class="pvp-media"><img src="${escAttr(guide.promoImage)}"
          alt="${escAttr(guide.promoImageAlt)}" width="${escAttr(guide.promoImageW)}" height="${escAttr(guide.promoImageH)}"
          loading="lazy" /></div>`
    : '';
  // 배치: 넓은 화면에서 왼쪽 이미지 / 오른쪽 텍스트+버튼(2026-09-04 누나 지시).
  // 좁은 화면에서는 세로로 쌓는다 — 나란히 두면 양쪽 다 못 읽을 폭이 된다.
  // 인라인 스타일로는 미디어 쿼리를 못 쓰므로 카드가 자기 스타일을 함께 내보낸다.
  const css = `<style>
    .pvp{display:block;border-radius:16px;overflow:hidden;color:inherit;text-decoration:none}
    .pvp-in{display:flex;flex-direction:column}
    .pvp-media{flex:none;background:#fff}
    .pvp-title{line-height:1.25}
    .pvp-media img{display:block;width:100%;height:auto}
    .pvp-body{padding:20px;min-width:0}
    .pvp-eyebrow{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px}
    /* 제목이지만 h 태그가 아니다 — 광고 문구가 문서 아웃라인에 들어가면 제목 단위로
       훑는 독자·스크린리더에게 글의 한 섹션으로 읽힌다. 본문 H2보다 한 단계 아래. */
    .pvp-title{font-size:19px;font-weight:700;color:#111827;margin:0 0 10px;text-wrap:balance;line-height:1.25}
    .pvp-text{color:#4b5563;margin:0 0 20px}
    /* 좁은 폭에서는 버튼이 폭을 꽉 채운다 — 손가락으로 누르는 화면이라 넓을수록 낫다. */
    .pvp-cta{display:flex;width:100%;justify-content:center;align-items:center;gap:8px;
      padding:14px 28px;color:#fff;border-radius:14px;font-weight:700;font-size:16px;
      box-shadow:0 6px 16px rgba(0,0,0,.14);text-shadow:0 1px 2px rgba(0,0,0,.35)}
    /* 광고임을 밝히는 문장이 페이지에서 가장 안 보이는 글자가 되면 안 된다. #4b5563 = 7.0:1 */
    .pvp-fine{font-size:12px;color:#4b5563;margin:16px 0 0}
    @media (min-width:520px){ .pvp-title{font-size:21px} }
    @media (min-width:620px){
      .pvp-in{flex-direction:row;align-items:stretch}
      /* 이미지 열 45%. 세로는 가운데 — 이미지 비율이 제각각이라(PeriodVol 600x1225,
         CourtClock 720x775) 위로 붙이면 짧은 이미지 아래가 비어 보인다. */
      .pvp-media{width:45%;max-width:320px;display:flex;align-items:center}
      .pvp-body{flex:1;padding:26px 28px;display:flex;flex-direction:column;justify-content:center}
      /* 넓은 화면에서는 버튼이 글자 폭만큼만 — 꽉 찬 버튼은 데스크톱에서 과하다. */
      .pvp-cta{display:inline-flex;width:auto;align-self:flex-start}
    }
  </style>`;
  // 카드 전체가 하나의 클릭 대상이다. 예전에는 이미지와 버튼만 눌렸고 제목·본문은
  // 죽은 영역이었다 — 폰에서 카드의 대부분이 그 죽은 영역이었다(2026-09-04 누나 지시).
  // 그래서 바깥을 <a>로 감싸고 버튼은 <span>으로 바꿨다. <a> 안에 <a>는 못 넣는다.
  // 스크린리더가 카드 전문을 링크 이름으로 읽지 않도록 aria-label 로 요약한다.
  return `${css}<aside aria-label="${guide.lang === 'ko' ? '광고' : 'Advertisement'}" style="margin:24px 0;max-width:680px">
        <a class="pvp" href="${escAttr(guide.promoUrl)}" aria-label="${escAttr(guide.promoCta)}"
           style="border:2px solid ${theme.border};background:${theme.bg}">
          <span class="pvp-in">
            ${img}
            <span class="pvp-body">
              <span class="pvp-eyebrow" style="display:block;color:${theme.eyebrow}"><strong>${esc(guide.promoNote)}</strong></span>
              ${guide.promoTitle ? `<span class="pvp-title" style="display:block">${esc(guide.promoTitle)}</span>` : ''}
              <span class="pvp-text" style="display:block">${esc(guide.promoText)}</span>
              <span class="pvp-cta" style="background:${theme.cta}">${esc(guide.promoCta)} →</span>
              ${guide.promoFine ? `<span class="pvp-fine" style="display:block">${esc(guide.promoFine)}</span>` : ''}
            </span>
          </span>
        </a>
      </aside>`;
}

// The index exists in both languages. Without the Korean one, the seven
// Korean guides had no page linking to them in their own language — a
// crawler reaching /guides/<slug>-ko saw a page no Korean page pointed at.
function guideIndexHtml(lang = 'en') {
  // Declared inside the function: the writeRoute calls at the top of this file
  // run before any module-level const further down is initialised.
  const indexHrefs = { en: `${baseUrl}/guides`, ko: `${baseUrl}/guides-ko` };
  const indexAlternates = [
    { hreflang: 'en', href: indexHrefs.en, locale: 'en_AU' },
    { hreflang: 'ko', href: indexHrefs.ko, locale: 'ko_KR' },
    { hreflang: 'x-default', href: indexHrefs.en },
  ];
  const ko = lang === 'ko';
  const title = ko ? '가이드 — SaveBoard' : 'Guides — SaveBoard';
  const description = ko
    ? '직접 조사해서 순위를 매긴 리스트 — 항목마다 원 출처를 확인했고, 리스트 전체가 그대로 보드로 열립니다.'
    : 'Researched, ranked lists — every item checked against its own source, and every list opens as a board you can keep.';
  const canonical = ko ? indexHrefs.ko : indexHrefs.en;
  const otherHref = ko ? '/guides' : '/guides-ko';
  const body = `
    <main class="seo-page">
      <p><a href="${escAttr(otherHref)}">${ko ? 'English' : '한국어'}</a></p>
      <h1>${ko ? '가이드' : 'Guides'}</h1>
      <p>${esc(description)}</p>
      <section>
        ${guidePairs.map(pair => {
          const guide = ko ? pair.ko : pair.en;
          const href = ko ? `/guides/${pair.en.slug}-ko` : `/guides/${pair.en.slug}`;
          return `
          <article>
            <p><time datetime="${esc(guide.date)}">${esc(formatDate(guide.date, lang))}</time></p>
            <h2><a href="${escAttr(href)}">${esc(guide.title)}</a></h2>
            <p>${esc(guide.description)}</p>
          </article>
        `;
        }).join('')}
      </section>
      <p>${ko
        ? koLandingLinksHtml() || '<a href="/">SaveBoard</a>'
        : '<a href="/blog">SaveBoard blog</a> · <a href="/">SaveBoard</a>'}</p>
    </main>`;

  const jsonLd = [{
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: canonical,
    inLanguage: ko ? 'ko-KR' : 'en-AU',
    isPartOf: { '@type': 'WebSite', name: siteName, url: baseUrl },
    publisher: organization(),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: guidePairs.map((pair, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${baseUrl}/guides/${pair.en.slug}${ko ? '-ko' : ''}`,
        name: (ko ? pair.ko : pair.en).title,
      })),
    },
  }, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: siteName, item: baseUrl },
      { '@type': 'ListItem', position: 2, name: ko ? '가이드' : 'Guides', item: canonical },
    ],
  }];

  return withSeo({
    title,
    description,
    canonical,
    keywords: ko
      ? '큐레이션 리스트, 추천 리스트, 랭킹 리스트, 세이브보드 가이드'
      : 'curated lists, ranked lists, best of lists, saveboard guides',
    jsonLd,
    alternates: indexAlternates,
    locale: ko ? 'ko_KR' : 'en_AU',
  }, body);
}

// The Korean product pages have no Korean hub linking to them: the blog index is
// English and the landings are excluded from it by design. The Korean guides are
// the only Korean pages already in the index, so they carry the links.
function koLandingLinksHtml() {
  return landings.filter(page => page.lang === 'ko')
    .map(page => `<a href="/${esc(page.route)}">${esc(page.title)}</a>`)
    .join(' · ');
}

// Parse an "## FAQ" / "## Frequently Asked Questions" section: each "### Question"
// followed by paragraph text becomes a Q&A pair for FAQPage structured data.
function extractFaq(md) {
  const faqs = [];
  let inFaq = false;
  let q = null;
  let a = [];
  const flush = () => { if (q && a.length) faqs.push({ q: stripMd(q), a: stripMd(a.join(' ')) }); q = null; a = []; };
  for (const line of md.split('\n')) {
    const h2 = line.match(/^##\s+(.*)/);
    if (h2) { flush(); inFaq = /^(faq|frequently asked questions)\b/i.test(h2[1].trim()); continue; }
    if (!inFaq) continue;
    const h3 = line.match(/^###\s+(.*)/);
    if (h3) { flush(); q = h3[1].trim(); continue; }
    if (q && line.trim()) a.push(line.trim());
  }
  flush();
  return faqs;
}

function stripMd(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function markdownToHtml(md) {
  // Mirrors src/app/utils/markdownRenderer.tsx: a heading always starts its own
  // block, so a heading glued to a list can't stop the list parsing as a list.
  const blocks = md.split(/\n\n+/).flatMap(splitOnHeadings).filter(block => block.trim());
  return blocks.map(block => {
    const trimmed = block.trim();
    if (trimmed === '---') return '<hr />';
    if (trimmed.startsWith('# ')) return `<h1>${inline(trimmed.slice(2))}</h1>`;
    if (trimmed.startsWith('## ')) return `<h2>${inline(trimmed.slice(3))}</h2>`;
    if (trimmed.startsWith('### ')) return `<h3>${inline(trimmed.slice(4))}</h3>`;

    const lines = trimmed.split('\n');
    if (lines.every(line => /^\d+\. /.test(line))) {
      return `<ol>${lines.map(line => `<li>${inline(line.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    }
    if (lines.every(line => line.startsWith('- '))) {
      return `<ul>${lines.map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
    }
    if (/^\*\*[^*]+:\*\*$/.test(lines[0]) && lines.slice(1).every(line => line.startsWith('- '))) {
      return `<p>${inline(lines[0])}</p><ul>${lines.slice(1).map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
    }
    if (lines.every(line => line.trim().startsWith('|'))) {
      return tableToHtml(lines);
    }
    return `<p>${inline(trimmed.replace(/\n/g, ' '))}</p>`;
  }).join('\n');
}

function tableToHtml(lines) {
  const rows = lines.filter(line => !/^\|[\s|:-]+\|$/.test(line.trim()));
  const cells = line => line.split('|').slice(1, -1).map(cell => inline(cell.trim()));
  const [header, ...body] = rows;
  return `
    <table>
      <thead><tr>${cells(header).map(cell => `<th>${cell}</th>`).join('')}</tr></thead>
      <tbody>${body.map(row => `<tr>${cells(row).map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
}

function splitOnHeadings(block) {
  const out = [];
  let buffer = [];
  for (const line of block.split('\n')) {
    if (/^#{1,3} /.test(line)) {
      if (buffer.length) { out.push(buffer.join('\n')); buffer = []; }
      out.push(line);
    } else {
      buffer.push(line);
    }
  }
  if (buffer.length) out.push(buffer.join('\n'));
  return out;
}

function inline(text) {
  return esc(text)
    // Images first: "![alt](src)" would otherwise be consumed by the link rule.
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) =>
      `<img src="${escAttr(src)}" alt="${escAttr(alt)}" loading="lazy" />`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => `<a href="${escAttr(href)}">${label}</a>`);
}

function sitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const routes = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: `${baseUrl}/privacy`, lastmod: '2026-05-14', changefreq: 'monthly', priority: '0.5' },
    { loc: `${baseUrl}/terms`, lastmod: '2026-05-14', changefreq: 'monthly', priority: '0.5' },
    { loc: `${baseUrl}/blog`, lastmod: posts[0]?.date ?? today, changefreq: 'weekly', priority: '0.7' },
    ...landings.map(page => ({
      loc: `${baseUrl}/${page.route}`,
      lastmod: page.date,
      changefreq: 'monthly',
      priority: '0.9',
      alternates: postAlternates(page, `${baseUrl}/${page.route}`),
    })),
    ...posts.map(post => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.8',
      alternates: postAlternates(post, `${baseUrl}/blog/${post.slug}`),
    })),
    ...['en', 'ko'].map(lang => ({
      loc: lang === 'ko' ? `${baseUrl}/guides-ko` : `${baseUrl}/guides`,
      lastmod: guidePairs[0]?.en.date ?? today,
      changefreq: 'weekly',
      priority: '0.8',
      alternates: [
        { hreflang: 'en', href: `${baseUrl}/guides` },
        { hreflang: 'ko', href: `${baseUrl}/guides-ko` },
        { hreflang: 'x-default', href: `${baseUrl}/guides` },
      ],
    })),
    // Each language pair declares the other in-sitemap, which is the second
    // half of the hreflang contract (the pages carry <link rel=alternate>).
    ...guidePairs.flatMap(pair => {
      const en = `${baseUrl}/guides/${pair.en.slug}`;
      const ko = `${baseUrl}/guides/${pair.en.slug}-ko`;
      const alternates = [
        { hreflang: 'en', href: en },
        { hreflang: 'ko', href: ko },
        { hreflang: 'x-default', href: en },
      ];
      return [
        { loc: en, lastmod: pair.en.date, changefreq: 'monthly', priority: '0.9', alternates },
        { loc: ko, lastmod: pair.ko.date, changefreq: 'monthly', priority: '0.9', alternates },
      ];
    }),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes.map(route => `  <url>
    <loc>${route.loc}</loc>${(route.alternates ?? []).map(alt => `
    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`).join('')}
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

function organization() {
  return {
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/favicon-32.png`,
  };
}

function formatDate(iso, lang = 'en') {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(value) {
  return esc(value).replace(/'/g, '&#39;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
