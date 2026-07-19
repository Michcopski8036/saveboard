# marketing/

Drafts produced by the scheduled content agents. Nothing here is published by
existing — a file in this folder is a draft waiting for a person to decide on it.

| Folder | Agent | What it holds |
|---|---|---|
| `hooks/` | hook-researcher | Real quotes from forums and reviews, with sources. The raw material the other two write from. |
| `shortform/` | shortform-writer | Reel/Short scripts, KO + EN, with what to record for each. |
| `threads/` | buildinpublic-writer | Threads/X posts, each traced to a real commit or PR. |
| `offsite-listings.md` | marketing-assistant | Directory and launch submissions, and what's already been sent. |

## How something gets published

**Blog posts** are markdown in `src/blog/`, prerendered at build time by
`scripts/prerender-seo.mjs`. They go live when a PR is merged to `main` — the
merge *is* the publish step. There is no database and no publish button.

**Social content** is not auto-posted. Approving means copying the text into
Buffer or the app and scheduling it. Instagram and Threads posting via API needs
Meta business verification, which costs more effort than it saves at this size.

So the approval flow is the same for everything: read the PR, merge it or close
it. Merging a blog PR ships the page; merging a social PR just files the drafts
where you can find them.
