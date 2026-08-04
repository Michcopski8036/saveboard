# Weekly /guides/ content routine

Draft one guide post for saveboard.app/guides/. The repo is cloned for you.

FIRST, read these, in order:
- `docs/superpowers/specs/2026-07-27-perth-korean-guides-design.md` — the approved design:
  positioning, guardrails, what NOT to do.
- `docs/superpowers/plans/2026-07-27-perth-korean-guides.md` — how the pipeline works
  technically (Task 1 defines the markdown format; read the correction notes at the top of
  Tasks 1 and 2).
- `src/guides/korean-bbq-perth.en.md` — a place-based guide.
- `src/guides/free-ai-chatbots.en.md` — a software guide, with a comparison table.

**The section is no longer Perth-only.** It started there, but the format — a researched,
ranked list that also exists as a public board — carries any topic. Perth stays a valid
topic, not the theme.

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
**local (a city, any city) → tools or services → resources and reference**. Check
`src/guides/` for what exists and don't repeat a topic.

## Steps

1. Pick the topic and state, in one sentence to yourself, what you will verify.
2. Research **primary sources only**:
   - a business → that venue's own Google Business Profile (not another article; on the
     first run several widely-cited listicles were wrong)
   - a product or service → that company's own pricing and help pages
   - anything else → the thing's own site or documentation
   Where the source doesn't state something, **write that it doesn't** rather than
   repeating an unsourced number. "Not published" is a finding, and often the best line in
   the post. If a claim can't be sourced at all, drop the item — never invent to reach a
   round number. The Perth post shipped as nine, the chatbot post as eight.
3. Write `src/guides/<slug>.en.md` and `src/guides/<slug>.ko.md`. Match the shape of the two
   examples:
   - frontmatter: `title, date, description, slug, keywords, lang, list_type, board_url`
     (leave `board_url` empty for now). **`list_type` must be `place`, `software`, or
     `thing`** — it decides the structured data, and marking software up as a restaurant
     with a street address would be false.
   - a "pick by…" section above the list, so a reader can self-select
   - a comparison table (`## At a glance` / `## 한눈에 보기`) when the items differ along
     2–3 comparable axes
   - `## The List` / `## 리스트`, ranked, one line per item in exactly this shape:
     `1. **[Name](https://its-own-url)** ★ 4.3 · 1,017 reviews (qualifier) — write-up.`
     The `★ …` segment is optional and paren-free; **the parenthesised part is required** —
     an address for a place, a short qualifier for anything else ("free · account
     required"). Nested brackets in the name will break the parser.
   - the ranking method belongs in the **FAQ only**, never in the intro. A previous draft
     explained the method up front and read like a methodology note instead of a guide.
   - the board section sits directly above the FAQ.
4. Create the board: write a JSON file matching `create-guide-board.mjs`'s input shape
   (`boardName`, `items[].{title,url,description,image}`) under `marketing/guides-inputs/`
   and run `node scripts/create-guide-board.mjs <file>`.
   - **Fill in `image`.** Fetch each item's `og:image` (or its logo) and check the URL
     actually returns an image — empty images make the board a wall of grey link cards. If
     an origin blocks automated requests (chatgpt.com does), leave that one blank rather
     than guessing a URL that will 404.
   - This needs `GUIDES_BOT_USER_ID` and `SUPABASE_SERVICE_ROLE_KEY` in the environment. If
     `SUPABASE_SERVICE_ROLE_KEY` is not set — expected until it is provisioned for this
     routine — do NOT skip silently and do NOT publish with an empty `board_url`: finish
     everything else, leave it empty, and say clearly in the report that the board still
     needs creating.
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
