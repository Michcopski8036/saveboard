import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { adminEmailFromToken } from '../src/shared/admins';

const SUPABASE_URL = 'https://mchikdltrcbovhdzdhhf.supabase.co';

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

// ── app_config (the native update gate) ────────────────────────────────────
// This lives here rather than in its own api/ route on purpose: the Vercel plan
// caps this project at 12 Serverless Functions and we were at the ceiling, so a
// 13th file silently fails the whole deploy. Reached as
//   GET  /api/admin-stats?resource=app-config
//   POST /api/admin-stats?resource=app-config
const PLATFORMS = new Set(['ios', 'android']);
// Dotted numeric versions only — the gate compares these segment by segment.
const VERSION_RE = /^\d+(\.\d+){0,3}$/;

const cmpVer = (a: string, b: string) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
};

async function handleAppConfig(req: VercelRequest, res: VercelResponse, actor: string) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('app_config').select('*').order('platform');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ config: data ?? [] });
  }

  const { platform, latest_version, min_version, store_url } =
    req.body as { platform: string; latest_version: string; min_version: string; store_url: string };

  if (!PLATFORMS.has(platform)) return res.status(400).json({ error: 'platform must be ios or android' });
  if (!VERSION_RE.test(latest_version ?? '')) return res.status(400).json({ error: 'latest_version must look like 1.0.10' });
  if (!VERSION_RE.test(min_version ?? ''))    return res.status(400).json({ error: 'min_version must look like 1.0.10' });
  // min_version above latest would hard-block every user, including those on the newest build.
  if (cmpVer(min_version, latest_version) > 0) return res.status(400).json({ error: 'min_version cannot be higher than latest_version' });
  if (!/^https:\/\//.test(store_url ?? ''))   return res.status(400).json({ error: 'store_url must be https' });

  const { error } = await supabase.from('app_config').upsert({
    platform, latest_version, min_version, store_url, updated_at: new Date().toISOString(),
  }, { onConflict: 'platform' });
  if (error) return res.status(500).json({ error: error.message });

  console.log(`[admin-app-config] ${actor} set ${platform} latest=${latest_version} min=${min_version}`);
  return res.status(200).json({ ok: true });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify caller is an admin — decode JWT payload directly (no round-trip to Supabase auth)
  const actor = adminEmailFromToken(req.headers.authorization);
  if (!actor) return res.status(403).json({ error: 'Forbidden' });

  if (req.query.resource === 'app-config') return handleAppConfig(req, res, actor);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const now      = new Date();
  const weekAgo  = new Date(now.getTime() - 7  * 86400000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

  // ── Parallel data fetch ───────────────────────────────────────────────────
  const [
    usersRes,
    linksCountRes,
    linksWeekRes,
    linksOverTimeRes,
    topCategoriesRes,
    tagsRes,
    subscriptionsRes,
    sharedBoardsRes,
    sharedViewsRes,
    boardsByUserRes,
  ] = await Promise.all([
    // All users via admin API
    supabase.auth.admin.listUsers({ perPage: 1000 }),

    // Total links
    supabase.from('links').select('id', { count: 'exact', head: true }),

    // Links this week
    supabase.from('links').select('id', { count: 'exact', head: true }).gte('created_at', Date.now() - 7 * 86400000),

    // Links per day last 30 days (raw rows to group client-side)
    supabase.from('links').select('created_at').gte('created_at', Date.now() - 30 * 86400000).order('created_at', { ascending: true }),

    // Top boards by link count (board name resolved from boardsByUserRes below)
    supabase.from('links').select('board_id').not('board_id', 'is', null),

    // All tags (flat array per row)
    supabase.from('links').select('tags').not('tags', 'is', null),

    // All subscriptions
    supabase.from('subscriptions').select('*'),

    // Shared boards
    supabase.from('shared_boards').select('token, category, owner_email, view_count, created_at').order('view_count', { ascending: false }).limit(10),

    // Total share views
    supabase.from('shared_board_views').select('id', { count: 'exact', head: true }),

    // All boards (for per-user counts + resolving board_id → name for top boards)
    supabase.from('boards').select('id, owner_id, name'),
  ]);

  // ── Users ─────────────────────────────────────────────────────────────────
  const allUsers   = usersRes.data?.users ?? [];
  const totalUsers = allUsers.length;
  const newThisWeek  = allUsers.filter(u => u.created_at >= weekAgo).length;
  const newThisMonth = allUsers.filter(u => u.created_at >= monthAgo).length;

  // Build user email→id map for recent users table
  const recentUsers = [...allUsers]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20)
    .map(u => ({
      id: u.id, email: u.email ?? '', created_at: u.created_at,
      // Self-reported by the client at sign-in (see src/app/lib/profileMeta.ts).
      locale:    u.user_metadata?.locale ?? u.user_metadata?.language ?? '',
      platform:  u.user_metadata?.platform ?? '',
      lastSeen:  u.user_metadata?.last_seen ?? '',
      lastSignIn: u.last_sign_in_at ?? '',
      provider:  u.app_metadata?.provider ?? '',
    }));

  // ── Location: infer country from locale in user_metadata ──────────────────
  const LOCALE_TO_ISO: Record<string, string> = {
    'en-AU': 'AUS', 'en-US': 'USA', 'en-GB': 'GBR', 'en-CA': 'CAN',
    'en-NZ': 'NZL', 'en-SG': 'SGP', 'en-IN': 'IND', 'en-IE': 'IRL',
    'ko': 'KOR', 'ko-KR': 'KOR', 'ja': 'JPN', 'ja-JP': 'JPN',
    'zh': 'CHN', 'zh-CN': 'CHN', 'zh-TW': 'TWN', 'zh-HK': 'HKG',
    'fr': 'FRA', 'fr-FR': 'FRA', 'de': 'DEU', 'de-DE': 'DEU',
    'es': 'ESP', 'es-ES': 'ESP', 'es-MX': 'MEX', 'pt': 'BRA',
    'pt-BR': 'BRA', 'pt-PT': 'PRT', 'it': 'ITA', 'nl': 'NLD',
    'ru': 'RUS', 'ar': 'SAU', 'tr': 'TUR', 'vi': 'VNM',
    'th': 'THA', 'id': 'IDN', 'ms': 'MYS', 'fil': 'PHL',
    'en': 'USA', // default English → US
  };
  const localeToIso = (locale: string): string | null =>
    LOCALE_TO_ISO[locale] ?? (locale.includes('-') ? LOCALE_TO_ISO[locale.split('-')[0]] ?? null : null);

  const countryCount: Record<string, number> = {};
  for (const u of allUsers) {
    const locale: string = u.user_metadata?.locale ?? u.user_metadata?.language ?? '';
    const country = localeToIso(locale) ?? 'UNKNOWN';
    countryCount[country] = (countryCount[country] ?? 0) + 1;
  }
  // ── Presence: who is signed in right now ──────────────────────────────────
  // last_seen is a heartbeat stamped by the open app (src/app/lib/profileMeta.ts).
  const ACTIVE_WINDOW_MS = 15 * 60 * 1000;
  const nowMs = now.getTime();
  const seenMs = (u: any) => Date.parse(u.user_metadata?.last_seen ?? '');

  const withSeen = allUsers.filter(u => Number.isFinite(seenMs(u)));
  const activeNow   = withSeen.filter(u => nowMs - seenMs(u) <= ACTIVE_WINDOW_MS).length;
  const activeToday = withSeen.filter(u => nowMs - seenMs(u) <= 24 * 3600_000).length;
  const activeWeek  = withSeen.filter(u => nowMs - seenMs(u) <= 7 * 24 * 3600_000).length;

  const activeUsers = [...withSeen]
    .sort((a, b) => seenMs(b) - seenMs(a))
    .slice(0, 25)
    .map(u => ({
      id: u.id,
      email: u.email ?? '',
      lastSeen: u.user_metadata.last_seen,
      platform: u.user_metadata?.platform ?? '',
      country: localeToIso(u.user_metadata?.locale ?? u.user_metadata?.language ?? '') ?? '',
      online: nowMs - seenMs(u) <= ACTIVE_WINDOW_MS,
    }));

  const platformCount: Record<string, number> = { ios: 0, android: 0, web: 0, unknown: 0 };
  for (const u of allUsers) {
    const p: string = u.user_metadata?.platform ?? '';
    platformCount[p in platformCount ? p : 'unknown'] += 1;
  }

  const usersByCountry = Object.entries(countryCount)
    .filter(([c]) => c !== 'UNKNOWN')
    .sort(([, a], [, b]) => b - a)
    .map(([iso3, count]) => ({ iso3, count }));
  const unknownCount = countryCount['UNKNOWN'] ?? 0;

  // ── Links ─────────────────────────────────────────────────────────────────
  const totalLinks = linksCountRes.count ?? 0;
  const linksThisWeek = linksWeekRes.count ?? 0;

  // Group links-over-time by day
  const linksOverTime: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    linksOverTime[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of (linksOverTimeRes.data ?? [])) {
    const ts = typeof row.created_at === 'number' ? new Date(row.created_at) : new Date(row.created_at);
    const day = ts.toISOString().slice(0, 10);
    if (day in linksOverTime) linksOverTime[day]++;
  }
  const linksOverTimeArr = Object.entries(linksOverTime).map(([date, count]) => ({ date, count }));

  // Top categories (now boards): count links per board_id, resolve to board name.
  const boardName: Record<string, string> = {};
  for (const b of (boardsByUserRes.data ?? [])) boardName[b.id] = b.name;
  const catCount: Record<string, number> = {};
  for (const row of (topCategoriesRes.data ?? [])) {
    const name = boardName[row.board_id];
    if (name) catCount[name] = (catCount[name] ?? 0) + 1;
  }
  const topCategories = Object.entries(catCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([category, count]) => ({ category, count }));

  // Top tags
  const tagCount: Record<string, number> = {};
  for (const row of (tagsRes.data ?? [])) {
    for (const tag of (row.tags ?? [])) {
      tagCount[tag] = (tagCount[tag] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  // ── Subscriptions ─────────────────────────────────────────────────────────
  const subs = subscriptionsRes.data ?? [];
  const subByUser: Record<string, typeof subs[0]> = {};
  for (const s of subs) subByUser[s.user_id] = s;

  const proCount    = subs.filter(s => s.plan === 'pro'  && s.status === 'active').length;
  const teamCount   = subs.filter(s => s.plan === 'team' && s.status === 'active').length;
  const freeCount   = totalUsers - proCount - teamCount;
  const monthlyPro  = subs.filter(s => s.plan === 'pro' && s.billing_cycle === 'monthly' && s.status === 'active').length;
  const yearlyPro   = subs.filter(s => s.plan === 'pro' && s.billing_cycle === 'yearly'  && s.status === 'active').length;
  const stripeCount = subs.filter(s => s.source === 'stripe' && s.status === 'active').length;
  const appleCount  = subs.filter(s => s.source === 'apple'  && s.status === 'active').length;
  const cancelledCount = subs.filter(s => s.status === 'canceled' || s.status === 'cancelled').length;

  // Enrich recentUsers with plan info and link counts
  const { data: linksByUser } = await supabase.from('links').select('user_id');
  const userLinkCount: Record<string, number> = {};
  for (const row of (linksByUser ?? [])) {
    userLinkCount[row.user_id] = (userLinkCount[row.user_id] ?? 0) + 1;
  }

  const userBoardCount: Record<string, number> = {};
  for (const row of (boardsByUserRes.data ?? [])) {
    userBoardCount[row.owner_id] = (userBoardCount[row.owner_id] ?? 0) + 1;
  }

  const enrichedUsers = recentUsers.map(u => ({
    ...u,
    country: localeToIso(u.locale) ?? '',
    plan:  subByUser[u.id]?.plan  ?? 'free',
    status: subByUser[u.id]?.status ?? 'free',
    source: subByUser[u.id]?.source ?? null,
    linkCount:  userLinkCount[u.id]  ?? 0,
    boardCount: userBoardCount[u.id] ?? 0,
  }));

  // ── Shared boards ─────────────────────────────────────────────────────────
  const totalSharedBoards = (sharedBoardsRes.data ?? []).length;
  const totalShareViews   = sharedViewsRes.count ?? 0;

  return res.status(200).json({
    overview: { totalUsers, newThisWeek, newThisMonth, totalLinks, linksThisWeek, totalSharedBoards, totalShareViews },
    subscriptions: { proCount, teamCount, freeCount, monthlyPro, yearlyPro, stripeCount, appleCount, cancelledCount },
    recentUsers: enrichedUsers,
    usersByCountry,
    unknownLocationCount: unknownCount,
    usersByPlatform: platformCount,
    presence: { activeNow, activeToday, activeWeek, neverSeen: totalUsers - withSeen.length },
    activeUsers,
    topCategories,
    topTags,
    linksOverTime: linksOverTimeArr,
    topSharedBoards: sharedBoardsRes.data ?? [],
    generatedAt: now.toISOString(),
  });
}
