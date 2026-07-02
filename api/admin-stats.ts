import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mchikdltrcbovhdzdhhf.supabase.co';
const ADMIN_EMAILS = new Set(['michcopski@gmail.com', 'admin@saveboard.app']);

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify caller is the admin — decode JWT payload directly (no round-trip to Supabase auth)
  const token = (req.headers.authorization ?? '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    if (!ADMIN_EMAILS.has(payload.email ?? '')) return res.status(403).json({ error: 'Forbidden' });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

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

    // Top categories by link count
    supabase.from('links').select('category').neq('category', 'None').neq('category', null),

    // All tags (flat array per row)
    supabase.from('links').select('tags').not('tags', 'is', null),

    // All subscriptions
    supabase.from('subscriptions').select('*'),

    // Shared boards
    supabase.from('shared_boards').select('token, category, owner_email, view_count, created_at').order('view_count', { ascending: false }).limit(10),

    // Total share views
    supabase.from('shared_board_views').select('id', { count: 'exact', head: true }),

    // Board counts per user
    supabase.from('boards').select('owner_id'),
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
    .map(u => ({ id: u.id, email: u.email ?? '', created_at: u.created_at }));

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
  const countryCount: Record<string, number> = {};
  for (const u of allUsers) {
    const locale: string = u.user_metadata?.locale ?? u.user_metadata?.language ?? '';
    const iso = LOCALE_TO_ISO[locale] ?? (locale.includes('-') ? LOCALE_TO_ISO[locale.split('-')[0]] : null);
    const country = iso ?? 'UNKNOWN';
    countryCount[country] = (countryCount[country] ?? 0) + 1;
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

  // Top categories
  const catCount: Record<string, number> = {};
  for (const row of (topCategoriesRes.data ?? [])) {
    if (row.category) catCount[row.category] = (catCount[row.category] ?? 0) + 1;
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
    topCategories,
    topTags,
    linksOverTime: linksOverTimeArr,
    topSharedBoards: sharedBoardsRes.data ?? [],
    generatedAt: now.toISOString(),
  });
}
