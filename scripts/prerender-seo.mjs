import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const blogDir = path.join(root, 'src', 'blog');
const guidesDir = path.join(root, 'src', 'guides');
const baseUrl = 'https://www.saveboard.app';
const siteName = 'SaveBoard';
const ogImage = `${baseUrl}/og-image.png`;

const template = await readFile(path.join(distDir, 'index.html'), 'utf8');
const files = (await readdir(blogDir)).filter(file => file.endsWith('.md'));
const allPosts = (await Promise.all(files.map(async file => parsePost(await readFile(path.join(blogDir, file), 'utf8')))))
  .filter(post => post.slug)
  .sort((a, b) => b.date.localeCompare(a.date));

// Pages with a `route` frontmatter render at a top-level URL (e.g. /pocket-alternative)
// — better for SEO/AEO than /blog/* for cornerstone landing pages. The rest are blog posts.
const landings = allPosts.filter(post => post.route);
const posts = allPosts.filter(post => !post.route);

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

await writeRoute('guides', guideIndexHtml());
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
    content: match[2].trim(),
  };
}

// Guides reuse parsePost's frontmatter parser, then add the two guide-only
// fields and the language pairing implied by the filename suffix.
function parseGuide(raw, lang) {
  const post = parsePost(raw);
  return { ...post, lang, boardUrl: '' , ...extractGuideFrontmatter(raw) };
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
  }
  return data;
}

// Parses "## The List" / "## 리스트" numbered items: "1. **Name** (address) — note"
function extractListItems(md) {
  const items = [];
  const re = /^\d+\.\s+\*\*(.+?)\*\*\s*\(([^)]+)\)\s*(?:—|-)?\s*(.*)$/gm;
  let m;
  while ((m = re.exec(md))) {
    items.push({ name: m[1].trim(), address: m[2].trim(), note: m[3].trim() });
  }
  return items;
}

async function writeRoute(route, html) {
  const dir = path.join(distDir, route);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html, 'utf8');
}

function withSeo({ title, description, canonical, keywords = '', jsonLd = [] }, bodyHtml) {
  const fullTitle = title.includes(siteName) ? title : `${title} — ${siteName}`;
  const meta = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    keywords ? `<meta name="keywords" content="${esc(keywords)}" />` : '',
    `<meta name="author" content="${siteName}" />`,
    `<meta name="theme-color" content="#A259FF" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:type" content="${jsonLd.some(item => item['@type'] === 'Article') ? 'article' : 'website'}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:url" content="${esc(canonical)}" />`,
    `<meta name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    ...jsonLd.map(item => `<script type="application/ld+json">${JSON.stringify(item)}</script>`),
  ].filter(Boolean).join('\n    ');

  return template
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
        ${posts.map(post => `
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
      blogPost: posts.map(post => ({
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
function relatedLandingsHtml(excludeRoute = '') {
  const related = landings.filter(page => page.route !== excludeRoute);
  if (!related.length) return '';
  return `
      <section>
        <h2>Compare SaveBoard</h2>
        <ul>
          ${related.map(page => `<li><a href="/${esc(page.route)}">${esc(page.title)}</a></li>`).join('')}
        </ul>
      </section>`;
}

function articleHtml(post, { canonical, isLanding }) {
  const content = post.content.replace(new RegExp(`^#\\s+${escapeRegExp(post.title)}\\s*\\n+`), '');
  const article = markdownToHtml(content);
  const faqs = extractFaq(content);
  const backLink = isLanding ? '' : '<p><a href="/blog">All articles</a></p>';
  const body = `
    <main class="seo-page">
      <article>
        ${backLink}
        <header>
          <p><time datetime="${esc(post.date)}">${esc(formatDate(post.date))}</time></p>
          <h1>${esc(post.title)}</h1>
          <p>${esc(post.description)}</p>
        </header>
        ${article}
      </article>
      ${relatedLandingsHtml(post.route)}
      ${isLanding ? '<p><a href="/blog">Read the SaveBoard blog</a></p>' : ''}
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
    title: isLanding ? post.title : `${post.title} — SaveBoard Blog`,
    description: post.description,
    keywords: post.keywords,
    canonical,
    jsonLd,
  }, body);
}

function guideHtml(guide, otherLang) {
  const content = guide.content.replace(new RegExp(`^#\\s+${escapeRegExp(guide.title)}\\s*\\n+`), '');
  const article = markdownToHtml(content);
  const faqs = extractFaq(content);
  const items = extractListItems(content);
  const enUrl = `${baseUrl}/guides/${otherLang && guide.lang === 'ko' ? otherLang.slug : guide.slug}`;
  const koSlug = guide.lang === 'ko' ? guide.slug : (otherLang ? otherLang.slug : guide.slug);
  const canonical = guide.lang === 'ko' ? `${baseUrl}/guides/${koSlug}-ko` : `${baseUrl}/guides/${guide.slug}`;
  const otherHref = guide.lang === 'ko' ? `/guides/${koSlug}` : `/guides/${koSlug}-ko`;
  const otherLabel = guide.lang === 'ko' ? 'English' : '한국어';

  const boardCta = guide.boardUrl
    ? `<p><a href="${escAttr(guide.boardUrl)}">${guide.lang === 'ko' ? 'SaveBoard에서 전체 리스트 열기 →' : 'Open the full list as a SaveBoard →'}</a></p>`
    : '';

  const body = `
    <main class="seo-page">
      <article>
        <p><a href="/guides">${guide.lang === 'ko' ? '전체 가이드' : 'All guides'}</a> · <a href="${escAttr(otherHref)}">${otherLabel}</a></p>
        <header>
          <p><time datetime="${esc(guide.date)}">${esc(formatDate(guide.date))}</time></p>
          <h1>${esc(guide.title)}</h1>
          <p>${esc(guide.description)}</p>
        </header>
        ${boardCta}
        ${article}
      </article>
    </main>`;

  const jsonLd = [{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url: canonical,
    image: ogImage,
    datePublished: guide.date,
    dateModified: guide.date,
    inLanguage: guide.lang,
    author: { '@type': 'Organization', name: siteName },
    publisher: organization(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  }];
  if (items.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'LocalBusiness', name: item.name, address: item.address },
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
    title: `${guide.title} — SaveBoard Guides`,
    description: guide.description,
    keywords: guide.keywords,
    canonical,
    jsonLd,
  }, body);
}

function guideIndexHtml() {
  const title = 'Perth Guides — SaveBoard';
  const description = 'Local Perth lists, curated as SaveBoards — open one, save what you need, done.';
  const canonical = `${baseUrl}/guides`;
  const body = `
    <main class="seo-page">
      <h1>Perth Guides</h1>
      <p>${esc(description)}</p>
      <section>
        ${guidePairs.map(pair => `
          <article>
            <p><time datetime="${esc(pair.en.date)}">${esc(formatDate(pair.en.date))}</time></p>
            <h2><a href="/guides/${esc(pair.en.slug)}">${esc(pair.en.title)}</a></h2>
            <p>${esc(pair.en.description)}</p>
          </article>
        `).join('')}
      </section>
    </main>`;
  return withSeo({ title, description, canonical, jsonLd: [] }, body);
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
  const blocks = md.split(/\n\n+/).filter(block => block.trim());
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

function inline(text) {
  return esc(text)
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
    })),
    ...posts.map(post => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.8',
    })),
    { loc: `${baseUrl}/guides`, lastmod: guidePairs[0]?.en.date ?? today, changefreq: 'weekly', priority: '0.7' },
    ...guidePairs.flatMap(pair => [
      { loc: `${baseUrl}/guides/${pair.en.slug}`, lastmod: pair.en.date, changefreq: 'monthly', priority: '0.8' },
      { loc: `${baseUrl}/guides/${pair.en.slug}-ko`, lastmod: pair.ko.date, changefreq: 'monthly', priority: '0.7' },
    ]),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${route.loc}</loc>
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

function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', {
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
