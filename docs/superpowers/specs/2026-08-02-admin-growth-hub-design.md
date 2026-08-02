# Admin growth hub — design

**Status:** approved by 누나 2026-08-02.

## Problem

The admin console answers "how big is it" (users, links, subscriptions) but not the two
questions 누나 actually opens it with: **what needs my attention right now**, and **is the
marketing working**. Concretely, after publishing the first `/guides/` post there was no way
to answer "how many people read it, and did any of them open the board" — SaveBoard has no
analytics of any kind: no package, no script, no events table. Board views exist
(`shared_boards.view_count`) but carry no source, so a view can't be attributed to the guide
that sent it.

The Marketing tab is an empty placeholder ("AI Marketing Hub — coming next"), and the six
weekly cloud routines are invisible from the product: they run on claude.ai, which the app
cannot query.

## Goals

- Opening the admin answers **what to do** and **this week's numbers** with equal weight.
- The guide funnel is measurable end to end: page visit → board click.
- Each automated routine reports its own runs, so "did it run, did it work" is visible
  without leaving the page.

## Non-goals

- Google Search Console API integration (impressions/clicks stay in GSC for now).
- The AI Marketing Hub (needs an Anthropic key; no demand yet).
- Per-user cohort analysis, revenue analytics — one paid subscriber makes this noise.
- Any new Vercel serverless function: the project is on Hobby with a **12-function cap**,
  already worked around once (bot-stats was merged into seo-check).

## Data layer

Two tables, both written with the **public anon key** — no secret has to be handed to a
browser or a cloud routine, which is what previously blocked the routines from reporting.

### `page_events` — anonymous traffic

```
id uuid pk, event text, path text, referrer text, meta jsonb, created_at timestamptz
```

- `event` ∈ `pageview` | `board_click` | `signup_click`.
- No cookies, no IP, no identifier. A row says "this path was viewed, sent by this referrer,
  at this time" and nothing about who.
- RLS: `anon` may INSERT only. SELECT is service-role only (the admin API).
- Client fires one `pageview` per route change and one `board_click` on a guide's board CTA,
  carrying the guide slug in `meta`.
- Cheap noise filters: skip `navigator.webdriver`, and skip a repeat of the same path within
  30 seconds.

### `automation_runs` — routine self-reporting

```
id uuid pk, routine text, status text, summary text, artifact_url text, ran_at timestamptz
```

- Each routine's prompt gains a final step: insert one row with the anon key.
- `status` ∈ `success` | `partial` | `failed`; `summary` is one line ("guide published,
  board created manually").

Both tables are insert-only from the outside and tiny (tens of rows a day), which matters —
the database is a free-tier nano instance that ran out of memory on 2026-08-02.

## Admin surface

**Marketing tab becomes the growth hub** rather than adding an eighth tab, which would push
the tab bar into horizontal scrolling on a phone.

- **Overview** gains two blocks above the existing KPIs, side by side:
  - *What needs you* — routine results awaiting review, guides whose `board_url` is still
    empty, releases in review, failed routine runs.
  - *This week* — signups, saves, visits, board clicks, each against last week.
- **Marketing** — the funnel per page (visits → board clicks), the six routines with their
  last run and status, and where staged social content is sitting.
- **System** — Supabase response time, so the degradation that caused the 2026-08-02 outage
  is visible before it is felt. Plus last deploy time.
- **Content** — per-guide visits and board clicks; flag boards with no links.
- **Users / Revenue** — unchanged for now.

All new numbers are added to the existing `/api/admin-stats` response. No new endpoint.

## Error handling

Tracking is best-effort and must never affect the product: insert failures are swallowed,
and the tracking call is fire-and-forget. If `page_events` is empty the admin shows "no data
yet" rather than zeros that look like a drop to zero.

## Testing

No test framework in this repo. Verification is: typecheck, then confirm in the browser that
a pageview row appears after a visit, a board_click row after clicking the CTA, and that the
admin renders both from real rows — not from fixtures.
