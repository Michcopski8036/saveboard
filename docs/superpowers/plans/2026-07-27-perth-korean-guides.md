# Perth Korean Guides (`/guides/`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/guides/` local-listicle section on saveboard.app (weekly, bilingual, board-backed content) plus the two scripts a weekly cloud routine will call to create the SaveBoard board and assemble the video short.

**Architecture:** Extend the existing `scripts/prerender-seo.mjs` static-render pipeline with a second content source (`src/guides/`) that gets its own URL prefix, JSON-LD types, and sitemap section. Two new standalone Node scripts (`create-guide-board.mjs`, `build-guide-video.mjs`) are invoked by a weekly Claude Code cloud routine (not by this codebase) via CLI + JSON input/output files — the routine itself does the actual research/writing, which is not something to encode as deterministic code.

**Tech Stack:** Node.js (`node:fs/promises`, `node:crypto`, `node:child_process`), `@supabase/supabase-js` (already a dependency), Chrome headless (screenshot), `ffmpeg` (already installed on this machine — confirmed 2026-07-25/26).

## Global Constraints

- Deploy = push to `main` directly (no PR flow in this repo) — per `CLAUDE.md`.
- `npm run build` = `tsc --noEmit` → `vite build` → `node scripts/prerender-seo.mjs`. Always verify through this exact command, not by running `prerender-seo.mjs` alone against a stale `dist/`.
- Canonical host is `https://www.saveboard.app` (with `www`) — reuse the existing `baseUrl` constant, don't hardcode a bare-domain URL anywhere new.
- No fabricated business info, quotes, or reviews — an item with unverifiable facts gets dropped, not invented (from the approved spec).
- Photos: only a business's own official Google Business Profile or Instagram account, always attributed, never a private individual's post.
- No music track in generated videos (licensing).
- Step 8 (auto-publish to social) is explicitly out of scope for this plan — captions/video are generated and staged only.
- Commit messages end with the `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` trailer (per `CLAUDE.md` "Conventions").

---

## Task 1: Extend `prerender-seo.mjs` to render `src/guides/*.md` under `/guides/`

**Files:**
- Modify: `scripts/prerender-seo.mjs`
- Create (fixture, deleted at the end of Task 4 once real content replaces it): `src/guides/top-10-korean-bbq-perth.en.md`, `src/guides/top-10-korean-bbq-perth.ko.md`

**Interfaces:**
- Produces: `parseGuide(raw, lang)` → `{ title, date, description, slug, keywords, lang, boardUrl, content }`; `guideHtml(guide, otherLangGuide)` → `string` (full HTML page); `guideIndexHtml()` → `string`; `extractListItems(md)` → `Array<{ name, address, note }>`. Later tasks (2–3) don't call these directly — they're consumed only by this file's own build — but Task 4's fixture content must match the frontmatter shape this task defines.

### Guide markdown convention (define first, the parser depends on it)

Guide posts live as **paired files**: `src/guides/<slug>.en.md` and `src/guides/<slug>.ko.md` — mirrors PeriodVol's bilingual pattern, both required. Frontmatter adds two fields on top of the existing blog frontmatter shape:

```markdown
---
title: "Top 10 Korean BBQ Restaurants in Perth"
date: "2026-08-03"
description: "A researched, sourced list of Perth's best Korean BBQ spots — with a live SaveBoard you can open on your phone at the table."
slug: "top-10-korean-bbq-perth"
keywords: "perth korean bbq, korean restaurant perth, best korean food perth"
lang: "en"
board_url: "https://www.saveboard.app/shared/REPLACE_WITH_REAL_TOKEN"
---

# Top 10 Korean BBQ Restaurants in Perth

Intro paragraph...

## The List

1. **Restaurant Name** (123 Example St, Northbridge) — one-line note on what to order.
2. **Another Restaurant** (45 Sample Rd, Victoria Park) — one-line note.

## FAQ

### What makes this list different from other "best of" roundups?
Answer text.
```

The `## The List` section's numbered items (`1. **Name** (address) — note`) are parsed into `ItemList`/`LocalBusiness` JSON-LD. The Korean file (`.ko.md`) uses the same shape with `lang: "ko"` and Korean section headers (e.g. `## 리스트`) — the list-item regex matches on the `**Name** (address)` pattern regardless of the surrounding language, so it doesn't need a translated heading to match.

- [ ] **Step 1: Add `guidesDir`, path constants, and `parseGuide`**

In `scripts/prerender-seo.mjs`, after the existing `const blogDir = ...` line, add:

```js
const guidesDir = path.join(root, 'src', 'guides');
```

After the existing `parsePost` function, add:

```js
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
```

- [ ] **Step 2: Load and pair guide files**

After the existing `const allPosts = ...` block, add:

```js
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
```

- [ ] **Step 3: Write `guideHtml` and `guideIndexHtml`**

After the existing `articleHtml` function, add:

```js
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
```

- [ ] **Step 4: Wire guide routes into the main execution flow and sitemap**

Replace this existing block:

```js
await writeRoute('blog', blogIndexHtml());
for (const post of posts) {
  await writeRoute(`blog/${post.slug}`, articleHtml(post, { canonical: `${baseUrl}/blog/${post.slug}`, isLanding: false }));
}
for (const page of landings) {
  await writeRoute(page.route, articleHtml(page, { canonical: `${baseUrl}/${page.route}`, isLanding: true }));
}

await writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml(), 'utf8');
```

with:

```js
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
```

- [ ] **Step 5: Add guide entries to the sitemap**

In `sitemapXml()`, inside the `routes` array, after the `...posts.map(...)` block, add:

```js
    { loc: `${baseUrl}/guides`, lastmod: guidePairs[0]?.en.date ?? today, changefreq: 'weekly', priority: '0.7' },
    ...guidePairs.flatMap(pair => [
      { loc: `${baseUrl}/guides/${pair.en.slug}`, lastmod: pair.en.date, changefreq: 'monthly', priority: '0.8' },
      { loc: `${baseUrl}/guides/${pair.en.slug}-ko`, lastmod: pair.ko.date, changefreq: 'monthly', priority: '0.7' },
    ]),
```

- [ ] **Step 6: Create fixture guide content to test with**

Create `src/guides/top-10-korean-bbq-perth.en.md`:

```markdown
---
title: "Top 10 Korean BBQ Restaurants in Perth"
date: "2026-07-27"
description: "Fixture content for testing the /guides/ build — not for publication."
slug: "top-10-korean-bbq-perth"
keywords: "perth korean bbq, korean restaurant perth"
lang: "en"
board_url: "https://www.saveboard.app/shared/test-fixture"
---

# Top 10 Korean BBQ Restaurants in Perth

Fixture intro paragraph for build testing.

## The List

1. **Test Restaurant One** (1 Test St, Northbridge) — a test note.
2. **Test Restaurant Two** (2 Test St, Victoria Park) — another test note.

## FAQ

### Is this real content?
No — this is fixture content for testing the build pipeline, replaced in Task 4.
```

Create `src/guides/top-10-korean-bbq-perth.ko.md`:

```markdown
---
title: "퍼스 한식당 Top 10 (테스트)"
date: "2026-07-27"
description: "빌드 테스트용 픽스처 콘텐츠 — 실제 발행용 아님."
slug: "top-10-korean-bbq-perth"
keywords: "퍼스 한식당, 퍼스 고기집"
lang: "ko"
board_url: "https://www.saveboard.app/shared/test-fixture"
---

# 퍼스 한식당 Top 10 (테스트)

빌드 테스트용 픽스처 문단.

## 리스트

1. **테스트 식당 1** (1 Test St, Northbridge) — 테스트 노트.
2. **테스트 식당 2** (2 Test St, Victoria Park) — 테스트 노트.

## FAQ

### 이거 진짜 콘텐츠예요?
아니요 — 4번 작업에서 실제 콘텐츠로 교체될 빌드 테스트용 픽스처입니다.
```

- [ ] **Step 7: Build and verify**

Run: `cd ~/saveboard && npm run build`
Expected: build succeeds (no `tsc` errors — this file isn't type-checked since it's plain `.mjs`, but a syntax error will crash the `node scripts/prerender-seo.mjs` step and fail the whole command). Then inspect:

```bash
cat dist/guides/top-10-korean-bbq-perth/index.html | grep -o '<title>[^<]*'
cat dist/guides/top-10-korean-bbq-perth-ko/index.html | grep -o '<title>[^<]*'
grep -c "ItemList" dist/guides/top-10-korean-bbq-perth/index.html
grep "guides" dist/sitemap.xml
```

Expected: both title tags print correctly, `ItemList` count ≥ 1, and 3 `/guides` URLs appear in the sitemap (index + en + ko).

- [ ] **Step 8: Commit**

```bash
cd ~/saveboard
git add scripts/prerender-seo.mjs src/guides/
git commit -m "$(cat <<'EOF'
Add /guides/ bilingual local-listicle rendering to prerender-seo.mjs

Reuses the existing blog pipeline's frontmatter/markdown parsing, adds
guide-specific ItemList/LocalBusiness JSON-LD parsed from the "## The List"
numbered items, and a separate sitemap section so it doesn't compete with
the blog's own keyword focus. Fixture content included for build testing —
replaced with real content in the next task.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Guides-bot Supabase account + `scripts/create-guide-board.mjs`

**Files:**
- Create: `scripts/create-guide-board.mjs`
- Create: `scripts/fixtures/create-guide-board.sample.json` (test input)

**Interfaces:**
- Produces: CLI `node scripts/create-guide-board.mjs <input.json>` where input is `{ "boardName": string, "items": [{ "title": string, "url": string, "description": string, "image": string }] }`. Prints `{ "boardId": string, "shareUrl": string }` as its only stdout line on success (so a calling routine/agent can parse it), exits non-zero with a stderr message on failure. Task 5's routine prompt references this exact CLI contract.

- [ ] **Step 1: One-time setup — create the guides-bot Supabase auth user**

This is a one-time interactive step, not part of the repeatable script (creating an auth user twice would fail on the duplicate email). Run once:

```bash
cd ~/saveboard
node -e '
import("@supabase/supabase-js").then(async ({ createClient }) => {
  const supabase = createClient(
    "https://mchikdltrcbovhdzdhhf.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data, error } = await supabase.auth.admin.createUser({
    email: "guides-bot@saveboard.app",
    email_confirm: true,
    user_metadata: { name: "SaveBoard Guides" },
  });
  if (error) { console.error(error); process.exit(1); }
  console.log("guides-bot user_id:", data.user.id);
});
'
```

Expected: prints a UUID. **Save that UUID** — Step 2's script hardcodes it as `GUIDES_BOT_USER_ID`.

Requires `SUPABASE_SERVICE_ROLE_KEY` in the environment — same key already used by `api/admin-stats.ts` in production (Vercel env var). For local use, get it from the Vercel dashboard (Project Settings → Environment Variables) or `vercel env pull` if the project is linked, and `export SUPABASE_SERVICE_ROLE_KEY=...` in the shell before running any of this task's steps. Do not hardcode it into any committed file.

- [ ] **Step 2: Write `scripts/create-guide-board.mjs`**

```js
// Creates a public SaveBoard board + links for a weekly /guides/ post, owned by
// the guides-bot system account. Bypasses the create_board/share_board RPCs
// (which require a real authenticated auth.uid()) by inserting directly via
// the service-role client, which bypasses RLS. Deliberately does not replicate
// the per-plan board/share-count limits from those RPCs — this is an internal
// system account, not a paying user, so those tier caps don't apply.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const GUIDES_BOT_USER_ID = process.env.GUIDES_BOT_USER_ID ?? 'REPLACE_AFTER_STEP_1';
const SUPABASE_URL = 'https://mchikdltrcbovhdzdhhf.supabase.co';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/create-guide-board.mjs <input.json>');
  process.exit(1);
}
if (GUIDES_BOT_USER_ID === 'REPLACE_AFTER_STEP_1') {
  console.error('GUIDES_BOT_USER_ID is not set — run Task 2 Step 1 first, then export GUIDES_BOT_USER_ID.');
  process.exit(1);
}

const { boardName, items } = JSON.parse(await readFile(inputPath, 'utf8'));
if (!boardName || !Array.isArray(items) || !items.length) {
  console.error('Input JSON needs { boardName: string, items: Array<{title,url,description,image}> }');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: board, error: boardError } = await supabase
  .from('boards')
  .insert({ owner_id: GUIDES_BOT_USER_ID, name: boardName, sort_order: 0 })
  .select()
  .single();
if (boardError) { console.error('board insert failed:', boardError.message); process.exit(1); }

const { error: memberError } = await supabase
  .from('board_members')
  .insert({ board_id: board.id, user_id: GUIDES_BOT_USER_ID, role: 'owner' });
if (memberError) { console.error('board_members insert failed:', memberError.message); process.exit(1); }

const inviteToken = randomUUID();
const { error: tokenError } = await supabase
  .from('boards')
  .update({ invite_token: inviteToken })
  .eq('id', board.id);
if (tokenError) { console.error('invite_token update failed:', tokenError.message); process.exit(1); }

const linkRows = items.map(item => ({
  id: randomUUID(),
  user_id: GUIDES_BOT_USER_ID,
  board_id: board.id,
  url: item.url,
  title: item.title,
  description: item.description ?? '',
  image: item.image ?? '',
  created_at: Date.now(),
}));
const { error: linksError } = await supabase.from('links').insert(linkRows);
if (linksError) { console.error('links insert failed:', linksError.message); process.exit(1); }

console.log(JSON.stringify({
  boardId: board.id,
  shareUrl: `https://www.saveboard.app/shared/${inviteToken}`,
}));
```

- [ ] **Step 3: Create a test fixture and run it**

Create `scripts/fixtures/create-guide-board.sample.json`:

```json
{
  "boardName": "Test — Top 10 Korean BBQ Perth",
  "items": [
    { "title": "Test Restaurant One", "url": "https://example.com/one", "description": "1 Test St, Northbridge", "image": "https://example.com/one.jpg" },
    { "title": "Test Restaurant Two", "url": "https://example.com/two", "description": "2 Test St, Victoria Park", "image": "https://example.com/two.jpg" }
  ]
}
```

Run:

```bash
cd ~/saveboard
export GUIDES_BOT_USER_ID="<uuid from Step 1>"
node scripts/create-guide-board.mjs scripts/fixtures/create-guide-board.sample.json
```

Expected: a single line of JSON printed, e.g. `{"boardId":"...","shareUrl":"https://www.saveboard.app/shared/..."}`. Open the `shareUrl` in a browser (logged out / incognito) and confirm the board loads with both test links and no login prompt — this is the same public-board behaviour verified for user-created boards elsewhere in this codebase.

- [ ] **Step 4: Delete the test board**

The fixture run creates a real row in production Supabase. Delete it so it doesn't linger:

```bash
node -e '
import("@supabase/supabase-js").then(async ({ createClient }) => {
  const supabase = createClient("https://mchikdltrcbovhdzdhhf.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabase.from("boards").delete().eq("name", "Test — Top 10 Korean BBQ Perth");
  console.log(error ?? "deleted");
});
'
```

- [ ] **Step 5: Commit**

```bash
cd ~/saveboard
git add scripts/create-guide-board.mjs scripts/fixtures/create-guide-board.sample.json
git commit -m "$(cat <<'EOF'
Add scripts/create-guide-board.mjs — automated public board creation

Service-role script that creates a SaveBoard board + links for a weekly
guide post, owned by a dedicated guides-bot account (setup steps in the
task doc) rather than 누나's own account. Bypasses the create_board/
share_board RPCs (auth.uid()-gated) via direct table writes.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `scripts/build-guide-video.mjs` — photo + text card video assembly

**Files:**
- Create: `scripts/build-guide-video.mjs`
- Create: `scripts/fixtures/build-guide-video.sample.json`

**Interfaces:**
- Produces: CLI `node scripts/build-guide-video.mjs <input.json>` where input is `{ "slug": string, "cards": [{ "photoUrl": string, "caption": string, "durationSec": number }] }`. Writes cards + final video under `marketing/guides-social/<slug>/`. Prints the output video path as its only stdout line on success.

- [ ] **Step 1: Write the card HTML template and screenshot step**

```js
// Builds a vertical (1080x1920) short from a business photo + caption per
// card, using the same Chrome-headless screenshot technique as the existing
// SaveBoard text-card content (marketing/shortform/cards-*/), then assembles
// with ffmpeg. No music track — sidesteps licensing; most shorts are watched
// muted anyway.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/build-guide-video.mjs <input.json>');
  process.exit(1);
}
const { slug, cards } = JSON.parse(await readFile(inputPath, 'utf8'));
if (!slug || !Array.isArray(cards) || !cards.length) {
  console.error('Input JSON needs { slug: string, cards: Array<{photoUrl,caption,durationSec}> }');
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'marketing', 'guides-social', slug);
await mkdir(outDir, { recursive: true });

function cardHtml(photoUrl, caption) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:1080px;height:1920px;background:#000;overflow:hidden}
    .photo{width:1080px;height:1920px;object-fit:cover;position:absolute;inset:0;filter:brightness(0.6)}
    .caption{position:absolute;left:60px;right:60px;bottom:160px;color:#fff;
      font-family:-apple-system,sans-serif;font-size:56px;font-weight:700;
      line-height:1.3;text-shadow:0 2px 12px rgba(0,0,0,0.8)}
  </style></head><body>
    <img class="photo" src="${photoUrl}">
    <div class="caption">${caption}</div>
  </body></html>`;
}
```

- [ ] **Step 2: Add the per-card screenshot + concat-file assembly**

Append to the same file:

```js
const cardPaths = [];
for (let i = 0; i < cards.length; i++) {
  const html = cardHtml(cards[i].photoUrl, escapeHtml(cards[i].caption));
  const htmlPath = path.join(outDir, `card_${i}.html`);
  const pngPath = path.join(outDir, `card_${i}.png`);
  await writeFile(htmlPath, html, 'utf8');
  await run(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1080,1920',
    `--screenshot=${pngPath}`,
    `file://${htmlPath}`,
  ]);
  cardPaths.push({ pngPath, durationSec: cards[i].durationSec ?? 2.5 });
}

// ffmpeg concat demuxer file — each image held for its own duration.
// The concat demuxer requires the LAST entry to be repeated without a
// duration line, or ffmpeg drops its final frame's hold time.
const listLines = cardPaths.flatMap(c => [`file '${c.pngPath}'`, `duration ${c.durationSec}`]);
listLines.push(`file '${cardPaths[cardPaths.length - 1].pngPath}'`);
const listPath = path.join(outDir, 'concat.txt');
await writeFile(listPath, listLines.join('\n'), 'utf8');

const videoPath = path.join(outDir, 'video.mp4');
await run('ffmpeg', [
  '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
  '-vsync', 'vfr', '-pix_fmt', 'yuv420p', videoPath,
]);

console.log(videoPath);

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
```

- [ ] **Step 3: Create a test fixture and run it**

Create `scripts/fixtures/build-guide-video.sample.json` (uses a stable public test image so the fixture doesn't depend on a real business's photo staying online):

```json
{
  "slug": "test-fixture",
  "cards": [
    { "photoUrl": "https://picsum.photos/1080/1920?random=1", "caption": "Test Restaurant One — Northbridge", "durationSec": 2 },
    { "photoUrl": "https://picsum.photos/1080/1920?random=2", "caption": "Test Restaurant Two — Victoria Park", "durationSec": 2 }
  ]
}
```

Run:

```bash
cd ~/saveboard
node scripts/build-guide-video.mjs scripts/fixtures/build-guide-video.sample.json
open marketing/guides-social/test-fixture/video.mp4
```

Expected: prints `marketing/guides-social/test-fixture/video.mp4`, and the video plays two ~2-second cards with the photo + caption text visible, no crash.

- [ ] **Step 4: Delete fixture output, add the output directory to `.gitignore`**

Generated videos/cards are large binary output, not source — don't commit them.

```bash
rm -rf ~/saveboard/marketing/guides-social/test-fixture
echo 'marketing/guides-social/' >> ~/saveboard/.gitignore
```

- [ ] **Step 5: Commit**

```bash
cd ~/saveboard
git add scripts/build-guide-video.mjs scripts/fixtures/build-guide-video.sample.json .gitignore
git commit -m "$(cat <<'EOF'
Add scripts/build-guide-video.mjs — photo+caption short assembly

Chrome-headless screenshots per card (same technique as the existing
SaveBoard text-card content) concatenated with ffmpeg into a vertical MP4.
No music track — sidesteps licensing. Output goes to marketing/guides-social/
(gitignored, not source).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Replace fixture content with one real, published guide post

**Files:**
- Modify: `src/guides/top-10-korean-bbq-perth.en.md`, `src/guides/top-10-korean-bbq-perth.ko.md` (or create new real-slug files and delete the fixture pair — either way, no fixture/test content should remain live)

**Interfaces:**
- Consumes: Task 1's guide markdown convention, Task 2's `create-guide-board.mjs` CLI, Task 3's `build-guide-video.mjs` CLI.

This is the first end-to-end real run, done by hand (not by the not-yet-built weekly routine) to prove every piece connects. Real restaurant research for this one post — names, addresses, and each business's own official photo URL — happens in this step; that's editorial/research work for whoever executes this task, not something with a code snippet to paste.

- [ ] **Step 1: Research and write one real guide post pair**

Replace the fixture content in `src/guides/top-10-korean-bbq-perth.{en,ko}.md` with real, sourced content — same "## The List" numbered format from Task 1, same frontmatter shape. Leave `board_url` as a placeholder for now (filled in Step 3).

- [ ] **Step 2: Build the video**

Construct a real input JSON (matching Task 3's shape) from the same restaurants' official photos, run `node scripts/build-guide-video.mjs`, and confirm the output video looks right.

- [ ] **Step 3: Create the real board and fill in `board_url`**

```bash
export GUIDES_BOT_USER_ID="<uuid from Task 2 Step 1>"
node scripts/create-guide-board.mjs <path-to-real-input.json>
```

Copy the printed `shareUrl` into both `board_url` frontmatter fields.

- [ ] **Step 4: Build and verify the site**

```bash
cd ~/saveboard && npm run build
open dist/guides/top-10-korean-bbq-perth/index.html
```

Confirm the page renders, the board link works, and `grep -c "ItemList" dist/guides/top-10-korean-bbq-perth/index.html` still finds it.

- [ ] **Step 5: Commit and push**

```bash
cd ~/saveboard
git add src/guides/ dist/
git commit -m "$(cat <<'EOF'
Publish first real /guides/ post — Top 10 Korean BBQ in Perth

First end-to-end run of the guides pipeline: real researched content,
real public SaveBoard board, real assembled video (staged, not posted).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
git push origin main
```

---

## Task 5: Weekly cloud routine + agent console pointer

**Files:**
- Create: `marketing/guides-routine-prompt.md` (the routine's instructions, for reference/version history)
- Modify: the Creators Loft agent console artifact (published separately via the `Artifact` tool, not a repo file)

**Interfaces:** none — this task registers an operational routine and updates a dashboard, it doesn't add importable code.

- [ ] **Step 1: Write `marketing/guides-routine-prompt.md`**

Content (this becomes the routine's instructions verbatim):

```markdown
# Weekly /guides/ content routine

Draft one Perth-local guide post for saveboard.app/guides/. Repo is cloned for you.

FIRST, read: docs/superpowers/specs/2026-07-27-perth-korean-guides-design.md (the
approved design — positioning, guardrails, what NOT to do) and
docs/superpowers/plans/2026-07-27-perth-korean-guides.md (how the pipeline works
technically).

1. Pick the next topic, rotating: 맛집 (restaurants) → 생활정보 (lifestyle/practical) →
   사업체 (local business profiles) → repeat. Check src/guides/ for what's already been
   covered so far and don't repeat a topic/list.
2. Research real, sourced facts only — name, address, one distinguishing note, and an
   official photo URL (that business's own Google Business Profile or Instagram) per
   item. If you can't source enough real items for a "Top 10," ship fewer — never invent
   to hit a round number.
3. Write src/guides/<slug>.en.md and src/guides/<slug>.ko.md following the format in
   docs/superpowers/plans/2026-07-27-perth-korean-guides.md Task 1 (frontmatter fields,
   "## The List" numbered format). Leave board_url blank for now.
4. Create the board: write a JSON file matching create-guide-board.mjs's input shape
   (boardName, items[].{title,url,description,image}) and run
   `node scripts/create-guide-board.mjs <file>` (GUIDES_BOT_USER_ID and
   SUPABASE_SERVICE_ROLE_KEY must be set in the environment this routine runs in — if
   they aren't, stop and say so rather than skipping the board). Fill the printed
   shareUrl into both markdown files' board_url frontmatter.
5. Build the video: write a JSON file matching build-guide-video.mjs's input shape and
   run `node scripts/build-guide-video.mjs <file>`.
6. Write social captions (Threads/Facebook/Instagram, matching the "perthkorean" brand
   voice — see the design spec) to marketing/guides-social/<slug>/captions.md.
7. Run `npm run build`, confirm it succeeds and the new /guides/<slug> page looks right.
8. Commit and push directly to main (this repo's deploy path — no PR).
9. Do NOT post anything to social media. Captions and video are staged only.
10. Report back: the published URL, the board's shareUrl, and the path to the staged
    social content — so it can be added to the agent console.
```

- [ ] **Step 2: Register the cloud routine**

Using the same browser workflow already used earlier for the PeriodVol SEO routine (`claude.ai/code/routines` → New routine): create a routine named "SaveBoard — Perth guides (weekly)", repository `Michcopski8036/saveboard`, weekly schedule (any day/time not colliding with the existing Monday-morning SaveBoard routines — e.g. Wednesdays), paste Task 5 Step 1's prompt into Instructions, and **remove the Gmail/Google Calendar connectors that get auto-added** (known bug from earlier this session — always check after creating any routine), leaving only the repo-access connector.

- [ ] **Step 3: Add a row to the Creators Loft agent console**

Add a new automations-list row (same pattern as the existing SaveBoard/PeriodVol SEO routine rows) linking to the new routine, and a placeholder note in the console's "내가 볼 것" section explaining that after each run, staged social content will appear at `marketing/guides-social/<slug>/` and should get its own row once the first real run completes.

- [ ] **Step 4: Commit**

```bash
cd ~/saveboard
git add marketing/guides-routine-prompt.md
git commit -m "$(cat <<'EOF'
Add weekly /guides/ routine prompt

Documents the routine registered in claude.ai/code/routines so its
instructions have version history alongside the pipeline code they drive.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Plan self-review notes

- **Spec coverage:** location (`/guides/` on saveboard.app) → Task 1. Board automation → Task 2. Video assembly, no music → Task 3. First real content → Task 4. Weekly routine + step 8 deferred + console pointer → Task 5. All spec sections have a task.
- **Type/interface consistency checked:** `create-guide-board.mjs` input/output shape is identical between Task 2's own steps, Task 4's usage, and Task 5's routine prompt. `build-guide-video.mjs` likewise. `board_url` frontmatter field name matches between Task 1's parser and Task 4/5's usage.
- **Known gap, deliberately deferred:** `GUIDES_BOT_USER_ID` and `SUPABASE_SERVICE_ROLE_KEY` must be available in whatever environment runs the weekly cloud routine (Task 5), not just this local machine — verifying that a Claude Code cloud routine's execution environment can hold these as secrets is part of Task 5 Step 2, not solved in advance here, since it depends on what claude.ai/code/routines actually offers for env vars (unconfirmed as of this plan).
