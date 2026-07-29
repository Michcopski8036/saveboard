# Weekly /guides/ content routine

Draft one Perth-local guide post for saveboard.app/guides/. Repo is cloned for you.

FIRST, read: docs/superpowers/specs/2026-07-27-perth-korean-guides-design.md (the
approved design — positioning, guardrails, what NOT to do) and
docs/superpowers/plans/2026-07-27-perth-korean-guides.md (how the pipeline works
technically). Also read src/guides/korean-bbq-perth.en.md — the first real post, and
the format/tone to match.

1. Pick the next topic, rotating: 맛집 (restaurants) → 생활정보 (lifestyle/practical) →
   사업체 (local business profiles) → repeat. Check src/guides/ for what's already been
   covered so far and don't repeat a topic/list.
2. Research real, sourced facts only — name, address, one distinguishing note per item.
   **Verify every address against that venue's own Google Business Profile**, not against
   another article: on the first run, several widely-cited Perth listicles had a venue on
   the wrong street number or in a suburb it doesn't trade in. If a venue's own website
   and its own GBP disagree, say so in the post rather than picking one silently.
   If you can't source enough real items for a "Top 10," ship fewer — never invent to hit
   a round number. The first post shipped as nine.
3. Write src/guides/<slug>.en.md and src/guides/<slug>.ko.md following the format in
   docs/superpowers/plans/2026-07-27-perth-korean-guides.md Task 1 (frontmatter fields,
   "## The List" numbered format). Leave board_url blank for now.
4. Create the board: write a JSON file matching create-guide-board.mjs's input shape
   (boardName, items[].{title,url,description,image}) under marketing/guides-inputs/ and
   run `node scripts/create-guide-board.mjs <file>` (GUIDES_BOT_USER_ID and
   SUPABASE_SERVICE_ROLE_KEY must be set in the environment this routine runs in — if
   they aren't, stop and say so rather than skipping the board). Fill the printed
   shareUrl into both markdown files' board_url frontmatter.
   **Verify the board is actually public** before moving on: call the `get_shared_board`
   RPC with the **anon** key (`sb_publishable_...` from src/app/lib/supabase.ts) and
   confirm it returns a row. Do not verify by fetching the share URL and checking for
   HTTP 200 — SaveBoard is an SPA, every path returns 200 whether the board exists or not.
5. Build the video: write a JSON file matching build-guide-video.mjs's input shape and
   run `node scripts/build-guide-video.mjs <file>`. Only use a photo you are allowed to
   publish — that business's own official Google Business Profile or Instagram post,
   credited. If you can't source one that way, leave photoUrl empty: the card renders as
   a clean text-only card. Never use a private individual's photo.
6. Write social captions (Threads/Facebook/Instagram, matching the "perthkorean" brand
   voice — see the design spec) to marketing/guides-social/<slug>/captions.md.
7. Run `npm run build`, confirm it succeeds and the new /guides/<slug> page looks right.
8. Commit and push directly to main (this repo's deploy path — no PR).
9. Do NOT post anything to social media. Captions and video are staged only.
10. Report back: the published URL, the board's shareUrl, and the path to the staged
    social content — so it can be added to the agent console.
