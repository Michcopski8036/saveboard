# New off-site targets found 2026-09-03

Scope for this run: find directories/listicles/comparisons where a competitor of SaveBoard or
PeriodVol appears and ours does not, that are **not already covered** by
`marketing/offsite-listings.md`, `marketing/listicle-targets-2026-08-11.md` or
`marketing/listicle-outreach-drafts.md` (SaveBoard), nor by the equivalent three files in the
PeriodVol repo (`michcopski8036/periodvol`, cloned read-only into this session to check for
duplication — see the note below on why nothing is written there).

## ⚠️ Environment limitation this run

This session's network egress proxy returned `EGRESS_BLOCKED` / `403` for every outbound
`WebFetch` and `curl` to an external site, including `saveboard.app` itself and every
candidate directory below (confirmed via `$HTTPS_PROXY/__agentproxy/status` — a policy
denial, not a transient error). **Research this run relied on `WebSearch` result snippets
only; no page was opened and read in full**, unlike the 2026-08-11/08-12 batches, whose
quality bar was "every article opened and read again while drafting." That bar could not be
met this run.

Consequence for the drafts below: they avoid quoting or paraphrasing specific unverifiable
text from a target site (the thing the existing hard rule "verify every factual claim before
writing it" exists to prevent). Both new destinations are **self-serve directory profile
submissions** using SaveBoard's/PeriodVol's own already-verified canonical copy, not
personalized pitches that depend on reading someone else's page — that keeps the verification
risk to what WebSearch snippets can actually support. Where a detail (character limits, exact
form fields, current listing status) could not be confirmed this way, the draft says so
explicitly rather than guessing. **Whoever submits these should open the live page first** —
the copy is ready to paste, the form mechanics are not independently confirmed.

## Why these two directories

Both surfaced from WebSearch as **actively used, currently-dated (2026) directories that list
each app's direct competitors and do not list ours**, which is exactly the gap this routine
looks for — as opposed to most of this round's other search results, which were either
competitor content-marketing blogs (already systematically excluded in both repos' 🚩 tables)
or pages this session cannot open to verify.

### 1. SaaSHub (`saashub.com`) — both apps

- Free, self-serve product directory with per-category "Alternatives & Competitors" pages and
  head-to-head compare pages (e.g. `saashub.com/compare-period-tracker-vs-clue`,
  `saashub.com/bookmark-manager-alternatives`). WebSearch results carry a **2026 dateline**
  ("Best Bookmark Manager Products in 2026", "Top 15 Bookmark Manager Products of Feb 18,
  2026", "Best Period Tracking Apps..." compare pages) — the site is active this year, unlike
  several dead ends already logged elsewhere (Slant, Unstore).
- Competitors already listed there for SaveBoard's category: Raindrop.io, Pinboard, Bookmark
  OS, Bookmarkify, Bookmark Ninja. For PeriodVol's category: Clue, Flo, drip, Euki, Periodical
  all appear in compare pages. **Neither SaveBoard nor PeriodVol is listed under either
  category** (checked by search query, not by opening the page — see limitation above).
- Submission mechanics, per WebSearch summaries of third-party "how to submit to SaaSHub"
  guides (not SaaSHub's own page, which this session could not open): create an account →
  "Submit a Product" → name, tagline, homepage URL, description, categories, rivals/
  competitors, logo → free, usually reviewed within 1–2 days. A verified listing (using an
  email on the product's own domain) gets priority — SaveBoard could use an `@saveboard.app`
  address if one exists; PeriodVol's domain is receive-only (see PeriodVol's own
  `offsite-listings.md` on why outreach sends from `creatorsloftperth@gmail.com` instead), so
  its SaaSHub listing likely stays unverified unless that changes.
- **Character limits for the tagline/description fields are not confirmed** — the drafts below
  use the existing canonical one-liners, which are already short, and note where to trim if
  the live form is stricter.

Drafts: `marketing/saashub-submission-saveboard.md`, `marketing/saashub-submission-periodvol.md`.

### 2. MyHealthApps.net — PeriodVol only

- A patient/carer-run health-app directory (originally "European Directory of Health Apps",
  run by the nonprofit PatientView), collecting apps by patient and disability-group
  recommendation rather than by vendor self-promotion. This is a **different kind of
  legitimacy than AlternativeTo or SaaSHub** — its listings read as "apps this patient
  community actually uses," which fits PeriodVol's own positioning (a tool for the heavy-
  bleeding/bleeding-disorder audience) better than a generic SaaS directory does, and it
  charges nothing.
- Submission route confirmed by WebSearch snippet: `myhealthapps.net/submit`, described as
  "an online survey," open to developers as well as patient groups, published in several
  languages.
- ⚠️ **Recency could not be confirmed.** Every source WebSearch returned about the site's
  activity (VPH Institute launch notice, a Johnson & Johnson "innovative medicine" writeup, an
  MHFI news post) is old, and no 2025/2026 activity signal turned up. This is the same
  situation the 2026-08-11 PeriodVol research file flagged for r/VonWillebrand and VWD
  Sisterhood — a plausible, on-topic destination that this session could not verify is still
  maintained. **Before submitting, open `myhealthapps.net/submit` directly and confirm the
  form still loads and the site has recent (2025/2026) app entries** — if it doesn't, drop
  this one rather than spending the founder's time on a submission that goes nowhere.

Draft: `marketing/periodvol-myhealthapps-submission.md`.

## Candidates checked and rejected this run

- **Plotline / DocentPro / FOODIE / Stasht / MarkIt / Wapins** (various "save Instagram/
  TikTok/WhatsApp links" roundups) — every one that ranked well is either the competitor's own
  content-marketing blog ranking itself, or a different sub-niche (travel-map pinning, recipe
  extraction) that SaveBoard's visual-board pitch doesn't map onto cleanly. Same judgment
  already applied to the 🚩 competitor-blog table in `listicle-targets-2026-08-11.md`.
- **go-go-gaia.com, MensesBuddy, Longevity Advice** (period tracker comparison blogs) — same
  pattern: competitor's or a rival tracker's own content marketing.
- **Bearable's own "6 Best Period Tracker Apps of 2026"** — Bearable ranks itself; a
  competitor-authored listicle, excluded on the same rule as Cythr/Ferne/Floriva in
  PeriodVol's Batch 2.

## Not done this run, and why

- No new personalized listicle-correction pitches (the Cloudwards/Mozilla/Tuta style) —
  producing one responsibly requires reading the actual live article, which this session's
  network policy blocks. That style of outreach needs a session with working `WebFetch`/
  browser access; flag this to whoever runs the next batch.
- PeriodVol's own `marketing/offsite-listings.md` was **not edited** — this session has read
  access to `michcopski8036/periodvol` but push access was refused (`git push` denied; an org
  admin would need to install the Claude GitHub App there). Per this routine's own instruction
  ("write everything into marketing/ there" — the SaveBoard repo), the PeriodVol-facing drafts
  above live here instead. Whoever reviews this PR should manually copy the relevant lines into
  PeriodVol's own `offsite-listings.md` checklist once they've acted on them, so that repo's
  status file stays the source of truth for PeriodVol.
