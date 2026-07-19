import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminEmailFromToken } from './_admins';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mchikdltrcbovhdzdhhf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

function checkAuth(req: VercelRequest) {
  return adminEmailFromToken(req.headers.authorization) !== null;
}

function extractMeta(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
           ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'));
  return m?.[1] ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req)) return res.status(403).json({ error: 'Forbidden' });

  const url = 'https://www.saveboard.app';

  // Fetch main page + sitemap + robots in parallel
  const [htmlRes, sitemapRes, robotsRes] = await Promise.all([
    fetch(url, { headers: { 'User-Agent': 'SaveBoard-SEO-Check/1.0' } }).catch(() => null),
    fetch(`${url}/sitemap.xml`).catch(() => null),
    fetch(`${url}/robots.txt`).catch(() => null),
  ]);

  const html     = htmlRes     ? await htmlRes.text()     : '';
  const hasSmx   = sitemapRes  ? sitemapRes.ok             : false;
  const hasRobots = robotsRes  ? robotsRes.ok              : false;

  // ── Parse checks ────────────────────────────────────────────────────────
  const title       = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? '';
  const desc        = extractMeta(html, 'description');
  const ogTitle     = extractMeta(html, 'og:title');
  const ogDesc      = extractMeta(html, 'og:description');
  const ogImage     = extractMeta(html, 'og:image');
  const ogUrl       = extractMeta(html, 'og:url');
  const twCard      = extractMeta(html, 'twitter:card');
  const viewport    = extractMeta(html, 'viewport');
  const canonical   = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? '';
  const favicon     = html.includes('rel="icon"') || html.includes("rel='icon'");
  const hasH1       = /<h1[^>]*>[^<]+<\/h1>/i.test(html);
  const hasJsonLd   = html.includes('"@context"') && html.includes('schema.org');
  const isHttps     = url.startsWith('https://');

  const checks = [
    { id: 'title',     label: 'Title tag',            pass: title.length >= 10 && title.length <= 70,  detail: title ? `"${title.slice(0,60)}" (${title.length} chars)` : 'Missing' },
    { id: 'desc',      label: 'Meta description',     pass: desc.length >= 50 && desc.length <= 165,   detail: desc ? `${desc.length} chars` : 'Missing' },
    { id: 'og_title',  label: 'OG title',             pass: !!ogTitle,  detail: ogTitle || 'Missing' },
    { id: 'og_desc',   label: 'OG description',       pass: !!ogDesc,   detail: ogDesc ? `${ogDesc.length} chars` : 'Missing' },
    { id: 'og_image',  label: 'OG image',             pass: !!ogImage,  detail: ogImage ? 'Present' : 'Missing' },
    { id: 'og_url',    label: 'OG URL',               pass: !!ogUrl,    detail: ogUrl || 'Missing' },
    { id: 'twitter',   label: 'Twitter card',         pass: !!twCard,   detail: twCard || 'Missing' },
    { id: 'viewport',  label: 'Viewport meta',        pass: !!viewport, detail: viewport || 'Missing' },
    { id: 'canonical', label: 'Canonical URL',        pass: !!canonical, detail: canonical || 'Missing' },
    { id: 'favicon',   label: 'Favicon',              pass: favicon,    detail: favicon ? 'Present' : 'Missing' },
    { id: 'h1',        label: 'H1 heading',           pass: hasH1,      detail: hasH1 ? 'Present' : 'Missing' },
    { id: 'jsonld',    label: 'Structured data',      pass: hasJsonLd,  detail: hasJsonLd ? 'JSON-LD found' : 'Not found' },
    { id: 'sitemap',   label: 'sitemap.xml',          pass: hasSmx,     detail: hasSmx ? 'Accessible' : 'Not found' },
    { id: 'robots',    label: 'robots.txt',           pass: hasRobots,  detail: hasRobots ? 'Accessible' : 'Not found' },
    { id: 'https',     label: 'HTTPS',                pass: isHttps,    detail: isHttps ? 'Enabled' : 'Not enabled' },
  ];

  const passed = checks.filter(c => c.pass).length;
  const score  = Math.round((passed / checks.length) * 100);

  // Bot visits — merged in from the old /api/bot-stats to stay under Vercel Hobby's 12-function limit.
  const { data: botRows } = await supabase
    .from('bot_visits').select('bot_name, visited_at').order('visited_at', { ascending: false });
  const botMap: Record<string, { lastSeen: string; count: number }> = {};
  for (const row of (botRows ?? [])) {
    if (!botMap[row.bot_name]) botMap[row.bot_name] = { lastSeen: row.visited_at, count: 0 };
    botMap[row.bot_name].count++;
  }
  const bots = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity', 'Meta AI', 'Copilot'].map(name => ({
    name, lastSeen: botMap[name]?.lastSeen ?? null, count: botMap[name]?.count ?? 0,
  }));

  return res.status(200).json({ score, passed, total: checks.length, checks, checkedAt: new Date().toISOString(), bots });
}
