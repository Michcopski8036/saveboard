# Weekly /guides/ content routine

Draft one guide post for saveboard.app/guides/. The repo is cloned for you.

FIRST, read these, in order:
- `docs/superpowers/specs/2026-07-27-perth-korean-guides-design.md` — the approved design:
  positioning, guardrails, what NOT to do.
- `docs/superpowers/plans/2026-07-27-perth-korean-guides.md` — how the pipeline works
  technically (Task 1 defines the markdown format; read the correction notes at the top of
  Tasks 1 and 2).
- `src/guides/korean-bbq-perth.en.md` — read for the shape of a finished post, not as an
  invitation to write another city guide.
- `src/guides/free-ai-chatbots.en.md` — a software guide, with a comparison table.

**The section is no longer Perth-only.** It started there, but the format — a researched,
ranked list that also exists as a public board — carries any topic. City guides are still
part of the section; they are just not yours to write (see the place rule below).

## What makes a topic worth doing

Two things have to be true:

1. **People search for it.** Prefer phrasings people actually type ("best X", "free X",
   "X vs Y", "X near me").
2. **Something about it can be verified, and is usually got wrong.** This is the whole
   reason the post deserves to exist. In the Perth post it was addresses — published lists
   had a venue on the wrong street and another in a suburb it doesn't trade in. In the AI
   chatbots post it was free-tier limits — several vendors publish none, and the numbers
   blogs quote disagree with each other.

If you cannot name the verifiable thing before you start writing, pick a different topic.

Rotate the kind of list so the section doesn't become one narrow thing:
**tools or services → resources and reference**. Check `src/guides/` for what exists and
don't repeat a topic.

### ⛔ Do not pick a place topic

Restaurants, cafés, bars, gyms, clinics — anything with a street address. Every place guide
must carry each venue's Google star rating and review count, and **Google Maps cannot be
read from this environment**: it serves a JavaScript shell, so curl and WebFetch both come
back with no rating in the HTML. `npm run build` enforces this — a `list_type: place` guide
with any rating missing fails the build, so you would not be able to ship the run anyway.

City guides are still wanted; they get written in a session that has a real browser. Leave
them alone and pick a tools or reference topic.

## Steps

1. Pick the topic and state, in one sentence to yourself, what you will verify.
2. Research **primary sources only**:
   - a product or service → that company's own pricing and help pages
   - anything else → the thing's own site or documentation

   **Where a rating exists, get it from the store's own API, not from a review site.** For
   anything on the App Store, Apple's lookup endpoint is public, needs no key, and gives you
   the rating, the review count and the current price in one call:

   ```bash
   curl -s "https://itunes.apple.com/lookup?id=<TRACK_ID>&country=us" \
     | python3 -c "import json,sys; r=json.load(sys.stdin)['results'][0]; \
       print(r['trackName'], r['averageUserRating'], r['userRatingCount'], r['formattedPrice'])"
   ```

   Search for the id with `https://itunes.apple.com/search?term=<NAME>&entity=software&limit=5&country=us`.
   A 0-result lookup means the app has been **delisted** — that is a finding worth writing
   up, not a reason to guess (the basketball post led with one). Note the store: an app can
   be live in AU and gone in the US, so say which country you checked.
   Where the source doesn't state something, **write that it doesn't** rather than
   repeating an unsourced number. "Not published" is a finding, and often the best line in
   the post. If a claim can't be sourced at all, drop the item — never invent to reach a
   round number. The Perth post shipped as nine, the chatbot post as eight.
3. Write `src/guides/<slug>.en.md` and `src/guides/<slug>.ko.md`. Match the shape of the two
   examples:
   - frontmatter: `title, date, description, slug, keywords, lang, list_type, board_url`
     (leave `board_url` empty for now). **`list_type` must be `software` or `thing`** —
     `place` exists but is off-limits to this routine, see above. It decides the structured
     data, and marking software up as a restaurant with a street address would be false.
     There is also an optional `board_image`, a screenshot of the guide's own board shown in
     the CTA — leave it out; it needs a browser, so it's added in the manual pass.
   - a "pick by…" section above the list, so a reader can self-select
   - a comparison table (`## At a glance` / `## 한눈에 보기`) when the items differ along
     2–3 comparable axes
   - `## The List` / `## 리스트`, ranked, one line per item in exactly this shape:
     `1. **[Name](https://its-own-url)** ★ 4.3 · 1,017 reviews (qualifier) — write-up.`
     The `★ …` segment is paren-free and **required wherever a rating exists** — put it in
     for every app on a store, and leave it off only for things that genuinely have no
     rating anywhere (a plain website, a government page). Don't ask for a rating and then
     omit it because the number is unflattering; a low score with a small review count is
     worth saying out loud. **The parenthesised part is always required** — a short
     qualifier ("free · account required"). Nested brackets in the name break the parser.
     In Korean the segment reads `★ 4.3 · 리뷰 1,017개`.
   - the ranking method belongs in the **FAQ only**, never in the intro. A previous draft
     explained the method up front and read like a methodology note instead of a guide.
   - the board section sits directly above the FAQ.
4. Create the board: write a JSON file matching `create-guide-board.mjs`'s input shape
   (`boardName`, `items[].{title,url,description,image}`) under `marketing/guides-inputs/`
   and run `node scripts/create-guide-board.mjs <file>`.
   - **Write the board in BOTH languages.** One board serves both the English and the
     Korean post, and the share page picks by the reader's app language. So every input
     needs `boardName` + `boardNameKo`, and every item needs `title`/`titleKo` and
     `description`/`descriptionKo`. Don't machine-translate — write the Korean from your
     own `.ko.md`, in the same voice. The script warns if any Korean is missing; treat that
     warning as a failed run, not a nit.
   - **Fill in `image`, and look at what you fetched.** An `og:image` is often not a picture
     of the thing: on the ramen run, one venue's was a black background texture and
     another's was a snowy car park. A wrong picture is worse than none, so download each
     candidate and check it actually shows the product, the venue or its logo. If an origin
     blocks automated requests (chatgpt.com does), leave that one blank rather than guessing
     a URL that will 404.
   - This needs `GUIDES_BOT_EMAIL` and `GUIDES_BOT_PASSWORD` in the environment. The script
     signs in as that account and goes through the same RLS-guarded path the app uses; it
     does **not** take a service-role key, and must never be changed to — that key bypasses
     RLS on every table, which is far more than publishing a board needs. If the two vars
     are not set, do NOT skip silently: finish everything else, leave `board_url` empty, and
     put the board at the **top** of your report as the thing that still needs doing.
     An empty `board_url` hides the whole board section, so the post publishes with no CTA
     at all — the reader never learns the board exists. Write the board input JSON anyway
     and commit it, so creating the board afterwards is one command.
   - If it IS set, put the printed `shareUrl` into both files' `board_url`, then **verify
     the board is public** by calling the `get_shared_board` RPC with the ANON key (the
     `sb_publishable_…` value in `src/app/lib/supabase.ts`) and confirming it returns a row.
     Do NOT verify by fetching the share URL and checking for HTTP 200 — SaveBoard is an
     SPA and every path returns 200 whether the board exists or not.
5. Build the video: write a JSON file matching `build-guide-video.mjs`'s input shape and run
   it. Only use a photo you are allowed to publish — the subject's own official page or
   account, credited. Otherwise leave `photoUrl` empty and the card renders as clean text.
   Never use a private individual's photo. If Chrome or ffmpeg is unavailable here, skip the
   video and say so rather than failing the run.
6. Write social captions (Threads/Facebook/Instagram, Korean 반말 for the Korean audience) to
   `marketing/guides-social/<slug>/captions.md`. That folder is gitignored, so include the
   caption text in your final report.
7. Run `npm run build`, confirm it succeeds, and check `dist/guides/<slug>/index.html`
   contains the ItemList and FAQPage JSON-LD.
8. Commit and push directly to `main` — this repo's deploy path, no PR. End the commit
   message with: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
9. Do NOT post anything to social media. Captions and video are staged only.
10. Report the run so the admin console shows it. The key below is the **public** anon key
    (it ships in the web bundle) and `automation_runs` is insert-only — no select policy, so
    this grants nothing beyond adding a row. **Send it even if the run failed:** a missing
    row is indistinguishable from a routine that never fired.

    ```bash
    curl -s -X POST "https://mchikdltrcbovhdzdhhf.supabase.co/rest/v1/automation_runs" \
      -H "apikey: sb_publishable_aITf5gAB5i-gLx_mcS2Z5w_99ov4D9u" \
      -H "Authorization: Bearer sb_publishable_aITf5gAB5i-gLx_mcS2Z5w_99ov4D9u" \
      -H "Content-Type: application/json" \
      -d '{"routine":"guides","status":"success","summary":"<one line>","artifact_url":"<published url>"}'
    ```

    `status` is `success`, `partial` (something was skipped — e.g. the board), or `failed`.
11. Report back: the published URL, the board's shareUrl (or that it still needs creating),
    the captions, and anything you dropped for lack of a source.
