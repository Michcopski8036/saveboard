# Perth Korean Guides — `/guides/` section design

**Status:** approved by 누나 2026-07-27, ready for implementation planning.

## Purpose

A weekly, mostly-automated local-content section on `saveboard.app/guides/` — Perth
Korean-community listicles ("Top 10 한식당" etc.) — whose job is **not to earn its own
revenue** (ads/sponsorship don't fit a small local niche site, and sponsorship requires
manual sales that conflicts with automation). Its job is to be an **acquisition funnel
into SaveBoard**: every list is built as a real, public SaveBoard board, so reading the
post and using the product are the same action. Success is measured by SaveBoard
signups/board views this drives, not by the section's own traffic or ad revenue.

This originated from 누나's old, dormant Wix site (creators​loftperth5.wixsite.com/my-site-1
— a Perth Korean community blog covering local businesses, food, and lifestyle, last
updated 2022-2023, content dummy/placeholder). That site is **not reused**: a free Wix
subdomain carries near-zero SEO authority and outbound links are typically `nofollow`, so
posting there would not help SaveBoard's SEO, and Wix's editor cannot be driven by
automation (no reliable API/browser-automation path). A brand-new domain (e.g.
`perthkorean.com`, confirmed available via whois) was also considered and rejected: since
this section's only job is funneling into SaveBoard, hosting it as `saveboard.app/guides/`
reuses SaveBoard's existing domain authority, SEO infra (sitemap, IndexNow, GSC), and
build pipeline instead of standing up a parallel site/deploy/hosting stack.

## Non-goals

- Not a revenue business (no ads/sponsorship pursuit in this phase).
- Not reviving the old Wix site or its dummy content.
- Not auto-publishing to social media yet (see "Deferred" below).
- Not a full site redesign — SaveBoard's existing `/` and `src/blog/` content and SEO
  focus (bookmark-manager comparisons, etc.) are untouched; `/guides/` is a clearly
  separated new section so it doesn't dilute SaveBoard's core keyword focus.

## Architecture

Reuses SaveBoard's existing static-content pipeline (`scripts/prerender-seo.mjs`,
`src/blog/*.md` → prerendered pages, IndexNow, sitemap) rather than building a new one.

- **New content directory:** `src/guides/<slug>.en.md` + `src/guides/<slug>.ko.md` (paired,
  mirroring PeriodVol's bilingual pattern — Korean-community audience plus broader Perth
  English search both matter here, unlike SaveBoard's existing English-only `src/blog/`).
- **New route prefix:** `/guides/<slug>` (EN) and `/guides/<slug>-ko` (KO), rendered by
  extending `prerender-seo.mjs` to also read `src/guides/` and emit under that prefix —
  kept in its own sitemap section/URL prefix so it's clearly separable from
  `src/blog/`'s bookmark-manager-comparison keyword focus.
- **Structured data:** each guide post gets `ItemList` JSON-LD (the ranked list itself)
  plus a `LocalBusiness` entry per item (name, address) — this is the differentiator most
  competing local listicles skip, and it's what a "SaveBoard 큐레이션" framing earns
  legitimately (the list *is* structured data, because it's a real board).
- **Branding:** URL path stays `/guides/` (matches actual search phrasing — "Perth OO
  guide"); on-page copy uses "SaveBoard 큐레이션" language so the product story (SaveBoard
  curates the list) still comes through without hurting the URL's search-match.

## Board creation (automated, no manual step)

`src/app/lib/boards.ts`'s `createBoard`/`shareBoard` RPCs are `authenticated`-only
(confirmed via `supabase/migrations/20260702_unified_boards_phase2.sql`). SaveBoard
already has a service-role pattern for admin operations (`api/admin-stats.ts`,
`api/admin-update-plan.ts`), so guide-post board creation reuses that: a script with the
service-role key inserts directly into `boards` / `board_members` / `links` (bypassing
RLS) under a dedicated account.

- **Open decision, needs 누나's call before implementation:** create guide boards under
  her own SaveBoard account, or a separate "guides bot" account? A dedicated account is
  cleaner (keeps her personal boards list uncluttered, gives a consistent public owner
  name on shared board pages) — recommended default, but flag for confirmation in the
  implementation plan rather than assuming.
- Each board is made public the same way a user would (`share_board` RPC path via
  service-role), giving the same `invite_token` / public share URL used elsewhere in the
  app — no new sharing mechanism needed.

## Weekly automation pipeline (cloud routine, mirrors existing SaveBoard/PeriodVol routines)

Runs once a week. Steps 1–7 are fully automatic; step 8 is deferred (see below).

1. **Topic selection** — rotates through categories: 맛집 (restaurants) / 생활정보
   (lifestyle-practical) / 사업체 (local business profiles), matching the old Wix site's
   original categories.
2. **Research** — real, sourced facts only (name, address, signature item, an official
   photo source per business). Same honesty standard already established for SaveBoard's
   hook-researcher agent: no fabricated quotes/reviews, flag and skip anything unverifiable
   rather than inventing to hit a target count (e.g. "Top 10" ships as "Top 7" if only 7
   are real and sourced).
3. **Board creation** — service-role script creates the public board + links (previous
   section).
4. **Post write** — `src/guides/<slug>.{en,ko}.md`, embeds/links the board.
5. **Deploy** — commit + push to `main` → existing Vercel auto-deploy.
6. **Social copy** — Threads/Facebook/Instagram caption drafts for the new "perthkorean"
   accounts (누나 creates these herself — account creation isn't something Claude does).
   Saved to `marketing/guides-social/<slug>/captions.md`, not pushed live anywhere.
7. **Video short** — per listed business, pull a photo from **that business's own
   official Google Business Profile or Instagram** (never a customer's personal post),
   always credited/attributed to the source account. Assembled as: HTML card per
   photo+caption → Chrome headless screenshot (same technique as the existing SaveBoard
   text-card PRs) → `ffmpeg` concatenation with per-card timing, no music track (sidesteps
   licensing entirely; most shorts are watched muted anyway) → exported vertical MP4,
   saved alongside the captions in `marketing/guides-social/<slug>/`.
   Both ffmpeg and headless Chrome are already available on this machine — confirmed
   2026-07-25/26.
8. **~~Auto-publish~~ — deferred.** 누나 held this back 2026-07-27 ("8번 보류"). The
   social captions and video file from steps 6–7 are generated and staged, but posting is
   a manual step for now, same drafts-only pattern used everywhere else in Creators Loft.
   Revisit once there's a reason to trust it: this also sidesteps two unresolved
   dependencies — whether Buffer's free tier supports true unattended auto-publish (vs.
   its default review-queue behavior), and Meta/Threads Graph API's app-review
   requirements for automated posting.
   Since the post/board go live automatically (step 5) with no PR for her to notice,
   staged social content needs a visible pointer — add a row to the existing
   Creators Loft agent console artifact each run, linking to the new
   `marketing/guides-social/<slug>/` folder, so she has something to notice it by.

## Guardrails (apply even though steps 1–7 have no human review gate)

- No fabricated business info, quotes, or reviews — ever. Skip an item rather than
  invent one.
- Photo sourcing: only a business's own official account, always attributed, never a
  private individual's post (mirrors the existing no-identifying-a-private-individual
  rule already used in SaveBoard's hook research).
- No medical/legal/financial claims of any kind (n/a for restaurant content, but keep
  the same discipline as PeriodVol/SaveBoard's other content).
- If a week's research comes back thin (as has happened with SaveBoard's existing hook
  research some weeks), ship a shorter, honest list rather than padding it — matches the
  standard already set in `marketing/hooks/*.md`.

## Testing / verification before this goes live unattended

- First 1–2 runs should be manually triggered and reviewed end-to-end (board created
  correctly, post renders, JSON-LD validates, video file plays and looks right) before
  trusting the weekly schedule to run unwatched — not a human *content* review gate
  going forward, just confirming the pipeline itself works before leaving it alone.
- Verify `prerender-seo.mjs` extension doesn't regress the existing `src/blog/` output
  (run the existing build, diff output for blog pages before/after the `/guides/`
  extension is added).

## Open questions for the implementation plan

1. Guide-board owner account: 누나's own account vs. a dedicated "guides bot" account
   (leaning bot account, needs confirmation).
2. Where does the per-business "official photo" URL get sourced from during research —
   manual Google Places API integration (needs an API key) vs. the research step finding
   and citing an Instagram/Google post URL directly, same way SaveBoard's hook research
   already cites source URLs without an API. Recommend starting with the latter (no new
   API dependency) and revisiting if photo quality/consistency turns out to be a problem.
