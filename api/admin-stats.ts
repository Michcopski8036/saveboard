import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ── Admin allowlist ────────────────────────────────────────────────────────
// Inlined on purpose. Vercel transpiles each api/*.ts file individually rather
// than bundling it, so a relative import of a shared module resolves at
// typecheck time and then dies at runtime with ERR_MODULE_NOT_FOUND, taking
// every admin endpoint down. Keep in sync with src/shared/admins.ts (client).
const ADMIN_EMAILS = new Set([
  'michcopski@gmail.com',
  'admin@saveboard.app',
  'artking81@hotmail.com',
]);

// AI Office의 일일 크론이 사람 로그인 세션 없이 호출하기 위한 경로. 관리자 이메일
// allowlist와는 별개로, 이 값을 아는 서버만 통과한다. 이 경로로 통과한 호출자는
// handler()에서 traffic 집계 한 가지로만 응답 범위가 제한된다 — app_config
// (네이티브 강제 업데이트 게이트) 읽기/쓰기와 recentUsers 등 PII 필드는 반드시
// verifyAdmin()의 사람 관리자 JWT 경로로만 도달 가능하다.
//
// timingSafeEqual 패턴은 AI Office의 api/analytics.ts safeEqual()과 동일 —
// 길이가 다르면 timingSafeEqual 자체가 throw하므로 길이부터 맞춰 비교한다.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
function verifyCronSecret(req: import('@vercel/node').VercelRequest): boolean {
  const expected = process.env.SAVEBOARD_ANALYTICS_SECRET;
  const provided = req.headers['x-analytics-secret'];
  if (!expected || typeof provided !== 'string') return false;
  return safeEqual(provided, expected);
}

/** Verifies the bearer token WITH Supabase auth (validates the JWT signature —
 *  a bare payload decode is forgeable) and returns the caller's email if they
 *  are an admin, else null. */
async function verifyAdmin(authHeader: string | undefined): Promise<string | null> {
  const token = (authHeader ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  const email = data.user?.email ?? '';
  if (error || !email) return null;
  return ADMIN_EMAILS.has(email) ? email : null;
}


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

// ── Traffic ───────────────────────────────────────────────────────────────
// Factored out so the cron-secret path (below, in handler()) can compute
// exactly this and nothing else — it's the only thing AI Office's
// pullSaveBoard() (api/cron-analytics.ts) reads: traffic.{visits7d,
// boardClicks7d, topSources, topReferrers}.
type PageEvent = { event: string; path: string; referrer: string | null; source: string | null; created_at: string };

function computeTraffic(events: PageEvent[], now: Date) {
  const trafficNow = now.getTime();
  const ago = (days: number) => trafficNow - days * 86400000;
  const within = (e: PageEvent, from: number, to: number) => {
    const t = Date.parse(e.created_at);
    return t >= from && t < to;
  };

  const views  = events.filter(e => e.event === 'pageview');
  const clicks = events.filter(e => e.event === 'board_click');

  const byPathMap: Record<string, { path: string; views: number; boardClicks: number }> = {};
  for (const e of events) {
    if (!within(e, ago(7), trafficNow)) continue;
    const row = byPathMap[e.path] ?? { path: e.path, views: 0, boardClicks: 0 };
    if (e.event === 'pageview')    row.views += 1;
    if (e.event === 'board_click') row.boardClicks += 1;
    byPathMap[e.path] = row;
  }

  const refCount: Record<string, number> = {};
  const sourceCount: Record<string, number> = {};
  for (const e of views) {
    if (!within(e, ago(7), trafficNow)) continue;
    if (e.source) {
      sourceCount[e.source] = (sourceCount[e.source] ?? 0) + 1;
      continue; // utm_source/src가 있으면 그걸 채널로 쓰고 referrer는 보조지표로 안 겹친다
    }
    if (!e.referrer) continue;
    try {
      const host = new URL(e.referrer).host;
      refCount[host] = (refCount[host] ?? 0) + 1;
    } catch { /* unparseable referrer */ }
  }

  return {
    visits7d:      views.filter(e => within(e, ago(7), trafficNow)).length,
    visits7dPrev:  views.filter(e => within(e, ago(14), ago(7))).length,
    boardClicks7d: clicks.filter(e => within(e, ago(7), trafficNow)).length,
    guideViews7d: views.filter(e => e.path.startsWith('/guides') && within(e, ago(7), trafficNow)).length,
    storeClicksIos7d: events.filter(e => e.event === 'store_click_ios' && within(e, ago(7), trafficNow)).length,
    storeClicksAndroid7d: events.filter(e => e.event === 'store_click_android' && within(e, ago(7), trafficNow)).length,
    byPath: Object.values(byPathMap).sort((a, b) => b.views - a.views).slice(0, 12),
    topReferrers: Object.entries(refCount)
      .map(([referrer, n]) => ({ referrer, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 6),
    topSources: Object.entries(sourceCount)
      .map(([source, n]) => ({ source, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 10),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify caller is an admin — validates the JWT signature via Supabase auth —
  // or a server-to-server caller presenting the shared cron secret.
  const cronOk = verifyCronSecret(req);
  const actor = cronOk ? 'ai-office-cron' : await verifyAdmin(req.headers.authorization);
  if (!actor) return res.status(403).json({ error: 'Forbidden' });

  // app_config drives the native force-update gate (UpdateGate.tsx) — a cron
  // secret holder must never be able to read or (especially) write it. Only
  // a real human admin JWT, verified above via verifyAdmin(), may reach it.
  if (cronOk && req.query.resource === 'app-config') {
    return res.status(403).json({ error: 'Forbidden: cron secret cannot access app-config' });
  }
  if (req.query.resource === 'app-config') return handleAppConfig(req, res, actor);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const now      = new Date();

  // Cron-secret callers get traffic-only, computed from a single narrow query
  // — none of the user/subscription/activation queries below ever run for
  // them, so the shared secret (about to live in two separate Vercel
  // projects' env vars) never has a path to recentUsers, activation.neverSaved
  // /.dormant, or subscription details, and the cron isn't paying for data it
  // doesn't consume.
  if (cronOk) {
    const weekIso = new Date(now.getTime() - 7 * 86400000).toISOString();
    const [pageEventsRes, cronUsersRes, cronLinksTotalRes, cronLinksWeekRes] = await Promise.all([
      supabase.from('page_events')
        .select('event, path, referrer, source, created_at')
        .gte('created_at', new Date(now.getTime() - 14 * 86400000).toISOString()),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
      supabase.from('links').select('id', { count: 'exact', head: true }),
      supabase.from('links').select('id', { count: 'exact', head: true }).gte('created_at', weekIso),
    ]);

    const traffic = computeTraffic((pageEventsRes.data ?? []) as PageEvent[], now);

    // 2026-08-31: AI Office 실적 패널이 SaveBoard도 "재방문·저장"으로 읽을 수 있게
    // 집계 **숫자만** 추가한다. SaveBoard는 계정이 있는 앱이라 이 숫자들은 이미
    // 아는 사실이다 — CourtClock처럼 익명 설치 ID를 새로 심을 이유가 없고, 그래야
    // 스토어에 신고한 수집 항목도 그대로 둘 수 있다.
    //
    // 위 주석의 경계는 그대로다: 여기서 나가는 건 전부 스칼라 카운트이고,
    // recentUsers/activeUsers(이메일·플랫폼), activation.neverSaved/.dormant,
    // subscriptions는 여전히 사람 관리자 JWT 경로에서만 나온다. 사용자 목록을
    // 읽긴 하지만 개별 행은 응답에 담지 않고 세기만 한다.
    const cronUsers = cronUsersRes.data?.users ?? [];
    const nowMs = now.getTime();
    const seenMs = (u: { user_metadata?: { last_seen?: string } }) =>
      Date.parse(u.user_metadata?.last_seen ?? '');
    const within = (t: number, ms: number) => Number.isFinite(t) && nowMs - t <= ms;

    const aggregate = {
      totalUsers: cronUsers.length,
      newThisWeek: cronUsers.filter(u => (u.created_at ?? '') >= weekIso).length,
      // last_seen = 앱이 열려 있을 때 찍히는 하트비트, last_sign_in_at = 실제 인증.
      // 둘 다 내보내는 이유는 "실행"과 "로그인"이 다른 질문이기 때문이다.
      activeToday: cronUsers.filter(u => within(seenMs(u), 24 * 3600_000)).length,
      activeWeek: cronUsers.filter(u => within(seenMs(u), 7 * 24 * 3600_000)).length,
      loginsWeek: cronUsers.filter(u => within(Date.parse(u.last_sign_in_at ?? ''), 7 * 24 * 3600_000)).length,
      totalLinks: cronLinksTotalRes.count ?? 0,
      linksThisWeek: cronLinksWeekRes.count ?? 0,
    };

    return res.status(200).json({ traffic, aggregate, generatedAt: now.toISOString() });
  }

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
    pageEventsRes,
    automationRunsRes,
    linksByUserRes,
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

    // Anonymous traffic, last 14 days (7d window + the previous 7d to compare against)
    supabase.from('page_events').select('event, path, referrer, source, created_at')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString()),

    // Routine self-reports
    supabase.from('automation_runs').select('routine, status, summary, artifact_url, ran_at')
      .order('ran_at', { ascending: false }).limit(20),

    // Per-user link counts + first-save times (activation) — used to run as a
    // second sequential round-trip after this batch, adding a full DB RTT.
    supabase.from('links').select('user_id, created_at'),
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

  // 실제 로그인(인증) 기준 — 위 activeWeek는 앱이 켜져있을 때 찍히는 하트비트라
  // "로그인"과는 다른 지표. last_sign_in_at은 Supabase auth가 세션 발급 시마다 갱신.
  const loginsWeek = allUsers.filter(u => {
    const t = Date.parse(u.last_sign_in_at ?? '');
    return Number.isFinite(t) && nowMs - t <= 7 * 24 * 3600_000;
  }).length;

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
  const linksByUser = linksByUserRes.data;
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

  // ── Activation ────────────────────────────────────────────────────────────
  // At this size the useful question is not "how many signed up" but "how many
  // ever actually used it". Everything here comes from rows already fetched.
  const firstSaveAt: Record<string, number> = {};
  for (const row of (linksByUser ?? []) as Array<{ user_id: string; created_at: number | string }>) {
    const ts = typeof row.created_at === 'number' ? row.created_at : Date.parse(String(row.created_at));
    if (!Number.isFinite(ts)) continue;
    if (firstSaveAt[row.user_id] === undefined || ts < firstSaveAt[row.user_id]) {
      firstSaveAt[row.user_id] = ts;
    }
  }

  const realUsers = allUsers.filter(u => !/^sbtest|@apple\.com$|^testuser@/i.test(u.email ?? ''));
  const everSaved      = realUsers.filter(u => (userLinkCount[u.id] ?? 0) > 0);
  const savedThreePlus = realUsers.filter(u => (userLinkCount[u.id] ?? 0) >= 3);
  const madeABoard     = realUsers.filter(u => (userBoardCount[u.id] ?? 0) > 0);

  const firstSaveHours = everSaved
    .map(u => (firstSaveAt[u.id] - Date.parse(u.created_at)) / 3600000)
    .filter(h => Number.isFinite(h) && h >= 0)
    .sort((a, b) => a - b);
  const medianFirstSaveHours = firstSaveHours.length
    ? Math.round(firstSaveHours[Math.floor(firstSaveHours.length / 2)] * 10) / 10
    : null;

  const neverSaved = realUsers
    .filter(u => (userLinkCount[u.id] ?? 0) === 0)
    .map(u => ({ email: u.email ?? '', createdAt: u.created_at }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  const DORMANT_MS = 14 * 86400000;
  const dormant = realUsers
    .map(u => {
      const seen = (u.user_metadata as any)?.last_seen ?? u.last_sign_in_at ?? null;
      return { email: u.email ?? '', lastSeen: seen, linkCount: userLinkCount[u.id] ?? 0 };
    })
    .filter(u => u.linkCount > 0 && u.lastSeen && Date.now() - Date.parse(u.lastSeen) > DORMANT_MS)
    .sort((a, b) => Date.parse(a.lastSeen!) - Date.parse(b.lastSeen!))
    .slice(0, 12);

  const activation = {
    signedUp: realUsers.length,
    everSaved: everSaved.length,
    savedThreePlus: savedThreePlus.length,
    madeABoard: madeABoard.length,
    medianFirstSaveHours,
    neverSaved,
    dormant,
    excludedTestAccounts: allUsers.length - realUsers.length,
  };

  // ── Traffic ───────────────────────────────────────────────────────────────
  // page_events is insert-only for everyone but the service role, so this is
  // the only place the rows are ever read. `.data ?? []` also means a missing
  // table degrades to "no data yet" instead of failing the whole dashboard.
  // (computeTraffic() is the same function the cron-secret short-circuit above
  // uses — kept as one implementation so the two paths can't drift apart.)
  const traffic = computeTraffic((pageEventsRes.data ?? []) as PageEvent[], now);

  return res.status(200).json({
    overview: { totalUsers, newThisWeek, newThisMonth, totalLinks, linksThisWeek, totalSharedBoards, totalShareViews },
    subscriptions: { proCount, teamCount, freeCount, monthlyPro, yearlyPro, stripeCount, appleCount, cancelledCount },
    recentUsers: enrichedUsers,
    usersByCountry,
    unknownLocationCount: unknownCount,
    usersByPlatform: platformCount,
    presence: { activeNow, activeToday, activeWeek, loginsWeek, neverSeen: totalUsers - withSeen.length },
    activeUsers,
    topCategories,
    topTags,
    linksOverTime: linksOverTimeArr,
    topSharedBoards: sharedBoardsRes.data ?? [],
    traffic,
    activation,
    automations: automationRunsRes.data ?? [],
    generatedAt: now.toISOString(),
  });
}
