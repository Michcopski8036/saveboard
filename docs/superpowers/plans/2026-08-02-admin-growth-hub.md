# Admin Growth Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin console answer "what needs my attention" and "is the marketing working" — by recording anonymous page/click events and routine runs, and surfacing both in the existing admin.

**Architecture:** Two insert-only Supabase tables written with the **public anon key** (no secret reaches a browser or a cloud routine). The client fires fire-and-forget events; `/api/admin-stats` (existing endpoint — the project is at Vercel Hobby's 12-function cap) aggregates them with the service role; `AdminDashboard.tsx` renders them.

**Tech Stack:** React + TypeScript + Tailwind, Supabase (Postgres + RLS), Vercel serverless.

## Global Constraints

- **No new Vercel serverless function.** Hobby caps the project at 12; `api/bot-stats` was already merged into `api/seo-check` for this reason. All new admin data goes into `api/admin-stats.ts`.
- **Migrations are applied to prod by hand** (Supabase SQL editor) **before** deploying client code that depends on them — the client has no migration runner (`CLAUDE.md`).
- Tracking is best-effort: a failed insert must never surface to the user or block a render.
- No cookies, no IP, no identifier in `page_events`.
- Deploy = push to `main`. Commit messages end with the `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` trailer.
- Verification is `npm run typecheck` + real browser checks. There is no test framework in this repo — do not invent one.

---

## Task 1: Tables and RLS

**Files:**
- Create: `supabase/migrations/20260802_growth_tracking.sql`

**Interfaces:**
- Produces: tables `public.page_events(id, event, path, referrer, meta, created_at)` and `public.automation_runs(id, routine, status, summary, artifact_url, ran_at)`; both INSERT-able by `anon`, readable only by the service role.

- [ ] **Step 1: Write the migration**

```sql
-- Anonymous traffic + routine self-reporting. Both are insert-only from the
-- outside: the anon key can add rows but never read them back, so nothing here
-- is exposed to the public even though the key is public.

create table if not exists public.page_events (
  id          uuid primary key default gen_random_uuid(),
  event       text not null check (event in ('pageview', 'board_click', 'signup_click')),
  path        text not null,
  referrer    text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists page_events_created_idx on public.page_events (created_at desc);
create index if not exists page_events_path_idx    on public.page_events (path);

create table if not exists public.automation_runs (
  id            uuid primary key default gen_random_uuid(),
  routine       text not null,
  status        text not null check (status in ('success', 'partial', 'failed')),
  summary       text,
  artifact_url  text,
  ran_at        timestamptz not null default now()
);
create index if not exists automation_runs_ran_idx on public.automation_runs (ran_at desc);

alter table public.page_events    enable row level security;
alter table public.automation_runs enable row level security;

-- INSERT only. No select policy exists, so anon/authenticated can never read
-- these back; the admin endpoint reads them with the service role, which
-- bypasses RLS.
drop policy if exists page_events_insert on public.page_events;
create policy page_events_insert on public.page_events
  for insert to anon, authenticated with check (true);

drop policy if exists automation_runs_insert on public.automation_runs;
create policy automation_runs_insert on public.automation_runs
  for insert to anon, authenticated with check (true);
```

- [ ] **Step 2: Apply it to production by hand**

Paste the file into the Supabase SQL editor for project `mchikdltrcbovhdzdhhf` and run it. Nothing in later tasks works until this is applied.

- [ ] **Step 3: Verify anon can write but not read**

```bash
K="sb_publishable_aITf5gAB5i-gLx_mcS2Z5w_99ov4D9u"
B="https://mchikdltrcbovhdzdhhf.supabase.co"
# expect 201
/usr/bin/curl -s -o /dev/null -w "insert=%{http_code}\n" -X POST "$B/rest/v1/page_events" \
  -H "apikey: $K" -H "Authorization: Bearer $K" -H "Content-Type: application/json" \
  -d '{"event":"pageview","path":"/__migration_check","referrer":null}'
# expect an empty array (RLS hides rows) — NOT the row just written
/usr/bin/curl -s "$B/rest/v1/page_events?select=id&limit=1" -H "apikey: $K" -H "Authorization: Bearer $K"
```

- [ ] **Step 4: Commit**

```bash
cd ~/saveboard
git add supabase/migrations/20260802_growth_tracking.sql
git commit -m "$(cat <<'EOF'
Add page_events and automation_runs tables

Insert-only from the outside: the anon key can write rows but no select
policy exists, so nothing is readable without the service role. That is what
lets the browser and the cloud routines report without holding a secret.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Client tracking

**Files:**
- Create: `src/app/lib/track.ts`
- Modify: `src/main.tsx` (fire a pageview per route)
- Modify: `src/app/components/guides/GuidePostPage.tsx` (board CTA click)

**Interfaces:**
- Produces: `track(event: TrackEvent, meta?: Record<string, unknown>): void` and `usePageviews(): void`, where `TrackEvent = 'pageview' | 'board_click' | 'signup_click'`.

- [ ] **Step 1: Write the tracker**

```ts
// src/app/lib/track.ts
import { supabase } from './supabase';

export type TrackEvent = 'pageview' | 'board_click' | 'signup_click';

const recent = new Map<string, number>();
const DEDUPE_MS = 30_000;

/**
 * Fire-and-forget, anonymous. Records that a path was seen and where it came
 * from — never who. Failures are swallowed: analytics must not be able to
 * break a page.
 */
export function track(event: TrackEvent, meta: Record<string, unknown> = {}) {
  try {
    if (typeof window === 'undefined') return;
    if ((navigator as any).webdriver) return;          // automated browser

    const path = window.location.pathname;
    const key = `${event}:${path}`;
    const now = Date.now();
    if (now - (recent.get(key) ?? 0) < DEDUPE_MS) return;
    recent.set(key, now);

    const referrer = document.referrer && !document.referrer.startsWith(window.location.origin)
      ? document.referrer.slice(0, 300)
      : null;

    void supabase.from('page_events').insert({ event, path, referrer, meta }).then(
      () => {}, () => {},
    );
  } catch { /* never surface */ }
}
```

- [ ] **Step 2: Add the route hook to the same file**

```ts
import { useEffect } from 'react';
import { useLocation } from 'react-router';

/** One pageview per route change, including the first render. */
export function usePageviews() {
  const location = useLocation();
  useEffect(() => { track('pageview'); }, [location.pathname]);
}
```

- [ ] **Step 3: Call it once, inside the router**

In `src/main.tsx`, add a component that sits inside `<BrowserRouter>` (the hook needs router context) and renders the routes:

```tsx
import { usePageviews } from "./app/lib/track.ts";

function TrackedRoutes() {
  usePageviews();
  return (
    <Routes>
      {/* existing <Route> elements move here unchanged */}
    </Routes>
  );
}
```

Replace the inline `<Routes>` inside `<LanguageProvider>` with `<TrackedRoutes />`.

- [ ] **Step 4: Record the board click**

In `src/app/components/guides/GuidePostPage.tsx`, the CTA is the `<a href={guide.boardUrl}>`. Add:

```tsx
onClick={() => track('board_click', { slug: guide.slug, lang: guide.lang })}
```

and `import { track } from '../../lib/track';`

- [ ] **Step 5: Typecheck, build, verify in a real browser**

```bash
cd ~/saveboard && npm run typecheck && npm run build
```

Then load a guide page and click the board button. Confirm two rows landed (service role, because anon cannot read):

```bash
cd ~/saveboard/.claude/worktrees/perth-korean-guides && set -a && . ./.env.local && set +a
/usr/bin/curl -s -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "https://mchikdltrcbovhdzdhhf.supabase.co/rest/v1/page_events?select=event,path,referrer,created_at&order=created_at.desc&limit=5"
```

Expected: a `pageview` for the guide path and a `board_click` carrying the slug.

- [ ] **Step 6: Commit**

```bash
git add src/app/lib/track.ts src/main.tsx src/app/components/guides/GuidePostPage.tsx
git commit -m "$(cat <<'EOF'
Record anonymous pageviews and guide board clicks

There was no analytics of any kind, so "did anyone read the guide, and did
they open the board" had no answer. One row per route change and per board
CTA click: path, referrer, timestamp — no cookie, no identifier.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Aggregate in admin-stats

**Files:**
- Modify: `api/admin-stats.ts`

**Interfaces:**
- Produces, on the existing stats JSON: `traffic: { visits7d, visits7dPrev, boardClicks7d, byPath: Array<{ path, views, boardClicks }>, topReferrers: Array<{ referrer, n }> }` and `automations: Array<{ routine, status, summary, artifact_url, ran_at }>`.

- [ ] **Step 1: Fetch both tables alongside the existing queries**

Add to the existing `Promise.all` block of table reads:

```ts
supabase.from('page_events').select('event, path, referrer, created_at')
  .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString()),
supabase.from('automation_runs').select('routine, status, summary, artifact_url, ran_at')
  .order('ran_at', { ascending: false }).limit(20),
```

- [ ] **Step 2: Shape the traffic block**

```ts
const now = Date.now();
const evs = (pageEvents.data ?? []) as Array<{ event: string; path: string; referrer: string | null; created_at: string }>;
const since = (days: number) => now - days * 86400000;
const inWindow = (e: { created_at: string }, from: number, to: number) => {
  const t = Date.parse(e.created_at);
  return t >= from && t < to;
};

const views = evs.filter(e => e.event === 'pageview');
const clicks = evs.filter(e => e.event === 'board_click');

const byPathMap = new Map<string, { path: string; views: number; boardClicks: number }>();
for (const e of evs) {
  if (!inWindow(e, since(7), now)) continue;
  const row = byPathMap.get(e.path) ?? { path: e.path, views: 0, boardClicks: 0 };
  if (e.event === 'pageview') row.views += 1;
  if (e.event === 'board_click') row.boardClicks += 1;
  byPathMap.set(e.path, row);
}

const refCount = new Map<string, number>();
for (const e of views) {
  if (!e.referrer || !inWindow(e, since(7), now)) continue;
  try {
    const host = new URL(e.referrer).host;
    refCount.set(host, (refCount.get(host) ?? 0) + 1);
  } catch { /* ignore unparseable referrers */ }
}

const traffic = {
  visits7d:      views.filter(e => inWindow(e, since(7), now)).length,
  visits7dPrev:  views.filter(e => inWindow(e, since(14), since(7))).length,
  boardClicks7d: clicks.filter(e => inWindow(e, since(7), now)).length,
  byPath: [...byPathMap.values()].sort((a, b) => b.views - a.views).slice(0, 12),
  topReferrers: [...refCount.entries()].map(([referrer, n]) => ({ referrer, n }))
    .sort((a, b) => b.n - a.n).slice(0, 6),
};
```

- [ ] **Step 3: Add both to the response payload**

```ts
traffic,
automations: automationRuns.data ?? [],
```

- [ ] **Step 4: Typecheck and verify the endpoint returns the new fields**

```bash
cd ~/saveboard && npm run typecheck && npm run build
```

After deploy, open the admin and confirm the network response for `/api/admin-stats` contains `traffic` and `automations`.

- [ ] **Step 5: Commit**

```bash
git add api/admin-stats.ts
git commit -m "$(cat <<'EOF'
admin-stats: aggregate traffic and routine runs

Folded into the existing endpoint rather than a new one — the project sits at
Vercel Hobby's 12-function cap.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Admin UI

**Files:**
- Modify: `src/app/components/AdminDashboard.tsx`

**Interfaces:**
- Consumes: `stats.traffic` and `stats.automations` from Task 3.

- [ ] **Step 1: "This week" strip on Overview**

Above the existing KPI grid, render four numbers with a week-over-week delta: signups, saves, visits (`traffic.visits7d` vs `visits7dPrev`), board clicks. When `traffic.visits7d === 0 && traffic.visits7dPrev === 0`, render "아직 데이터 없음" instead of zeros.

- [ ] **Step 2: "What needs you" block on Overview**

A list built from data already on the page:
- guides whose `board_url` is empty → "보드 링크 없는 가이드"
- `automations` rows with `status !== 'success'` in the last 14 days → "실패한 루틴"
- releases in review (from the existing release panel data)
Each row links to the relevant tab. If the list is empty, say "확인할 것 없음".

- [ ] **Step 3: Fill the Marketing tab**

Replace the "AI Marketing Hub — coming next" placeholder with:
- **Funnel table**: `traffic.byPath` rows (path, views, board clicks, click-through %).
- **Referrers**: `traffic.topReferrers`.
- **Automations**: `automations` rows — routine, last run (relative), status pill, summary, artifact link.

- [ ] **Step 4: Supabase latency on the System tab**

Time the admin-stats request client-side (`performance.now()` around the fetch) and show it next to the Supabase card, with a warning colour above 3000ms. This is the early-warning signal for the nano instance degradation seen on 2026-08-02.

- [ ] **Step 5: Typecheck, deploy, verify against real rows**

```bash
cd ~/saveboard && npm run typecheck && npm run build
```

Open `/admin`, confirm the Marketing tab lists real paths from `page_events` (not placeholders) and that the numbers match a direct query of the table.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/AdminDashboard.tsx
git commit -m "$(cat <<'EOF'
Admin: growth hub — weekly numbers, what-needs-you, funnel, automations

Marketing tab was an empty placeholder; it now carries the guide funnel
(visits to board clicks), referrers, and each routine's last run. Overview
gains this-week numbers and a short list of things awaiting a decision.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Routines report their runs

**Files:**
- Modify: `marketing/guides-routine-prompt.md`
- Modify: the registered routine prompts via `RemoteTrigger` (`trig_01Wkn47DHZ7HehTps7SqR4ca` and the five older routines)

**Interfaces:**
- Consumes: `public.automation_runs` from Task 1.

- [ ] **Step 1: Add the reporting step to the prompt file**

Append to `marketing/guides-routine-prompt.md`:

```markdown
11. Report the run so the admin console can show it. The anon key below is public
    (it ships in the web bundle) and this table is insert-only:

    curl -s -X POST "https://mchikdltrcbovhdzdhhf.supabase.co/rest/v1/automation_runs" \
      -H "apikey: sb_publishable_aITf5gAB5i-gLx_mcS2Z5w_99ov4D9u" \
      -H "Authorization: Bearer sb_publishable_aITf5gAB5i-gLx_mcS2Z5w_99ov4D9u" \
      -H "Content-Type: application/json" \
      -d '{"routine":"perth-guides","status":"success","summary":"<one line>","artifact_url":"<published url>"}'

    Use status "partial" when something was skipped (for example the board could not
    be created), and "failed" when the run did not produce a post.
```

- [ ] **Step 2: Update the live routine**

Fetch the current prompt with `RemoteTrigger {action:"get", trigger_id:"trig_01Wkn47DHZ7HehTps7SqR4ca"}`, append the same step 11 text, and write it back with `{action:"update"}`. Leave `mcp_connections` as-is — do not re-add Gmail/Calendar.

- [ ] **Step 3: Verify the row shape works**

```bash
/usr/bin/curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://mchikdltrcbovhdzdhhf.supabase.co/rest/v1/automation_runs" \
  -H "apikey: sb_publishable_aITf5gAB5i-gLx_mcS2Z5w_99ov4D9u" \
  -H "Authorization: Bearer sb_publishable_aITf5gAB5i-gLx_mcS2Z5w_99ov4D9u" \
  -H "Content-Type: application/json" \
  -d '{"routine":"manual-check","status":"success","summary":"plumbing test"}'
```

Expected: `201`. Confirm it appears in the admin's Marketing tab, then delete it with the service role.

- [ ] **Step 4: Commit**

```bash
git add marketing/guides-routine-prompt.md
git commit -m "$(cat <<'EOF'
Routines report each run to automation_runs

Uses the public anon key against an insert-only table, which is what makes
self-reporting possible from a cloud routine that holds no secret.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Plan self-review notes

- **Spec coverage:** page_events + automation_runs → Task 1. Client events → Task 2. Aggregation without a new function → Task 3. Overview blocks, Marketing hub, System latency → Task 4. Routine self-reporting → Task 5. Content-tab per-guide numbers are served by `traffic.byPath` (Task 3/4) since guide paths are page paths.
- **Deliberately not built** (from the spec's non-goals): GSC API, AI Marketing Hub, cohort analysis, Revenue changes.
- **Naming is consistent across tasks:** `track()` / `usePageviews()` (Task 2) are what Task 4 relies on indirectly through `traffic`; `traffic.byPath[].boardClicks` is spelled the same in Tasks 3 and 4.
