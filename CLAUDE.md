# SaveBoard — project guide for Claude

Visual, mobile-first bookmark/link-saver. Web (Vercel) + native iOS & Android (Capacitor).
Part of the **Creators Loft** studio (also PeriodVol). Founder: Mihee Youn (call her 누나).

## Stack
- React + Vite + TypeScript + Tailwind
- Capacitor 8 (`@capacitor/core` ^8.3.1) → iOS + Android
- Supabase (auth + Postgres + storage), project ref `mchikdltrcbovhdzdhhf`
- Vercel hosting; deploy = **push to `main`** → auto-deploy (GitHub: Michcopski8036/saveboard)
- `patch-package` (postinstall) — patches in `patches/`

## Identity / store IDs
- appId / bundle id (all platforms): `app.saveboard.saveboard`
- App Store ID: `6770486850` · Play package: `app.saveboard.saveboard`
- Apple Team ID: `AK64BS4ZQK` · App Store Connect upload Apple ID: `artking81@hotmail.com` (uses app-specific password)
- OAuth deep-link scheme: `app.saveboard.saveboard://` (login-callback, share/<token>)

## Commands
- Dev: `npm run dev`
- Build: `npm run build` → runs **`tsc --noEmit`** (typecheck gate — a type error fails the build/deploy) **then `vite build` then `node scripts/prerender-seo.mjs`** (blog/landing prerender + sitemap). Always use `npm run build` (not bare vite) so the typecheck runs and prerendered HTML + sitemap stay in sync.
- Typecheck only: `npm run typecheck` (`tsc --noEmit -p tsconfig.json`). Config is intentionally loose (`strict:false`) for legacy Figma-Make code, but still catches undefined names (TS2304) — the class of bug that caused the 2026-07-13 Share/Sidebar white-screen crash. Keep it at **zero errors** so the gate stays meaningful.
- After web changes that ship to native: `npx cap sync ios` / `npx cap sync android`.
- No automated tests. Verify via `npm run typecheck` + emulator/simulator.

## SEO/AEO content system (scripts/prerender-seo.mjs)
- Blog posts = markdown in `src/blog/*.md` with frontmatter `title/date/description/slug/keywords`. Auto-prerendered to `/blog/<slug>` with SEO meta + Article JSON-LD + sitemap entry.
- Add `route: "foo"` frontmatter → renders at **top-level `/foo`** (cornerstone landing), excluded from blog index, sitemap priority 0.9.
- Add a `## FAQ` / `## Frequently Asked Questions` section (`### Question` + answer paragraph) → auto-emits **FAQPage JSON-LD** (AEO).
- `public/llms.txt` served at `/llms.txt` for LLM crawlers. `api/robots.ts` allows all AI bots + logs them.
- Existing landings: `/pocket-alternative`, `/raindrop-alternative`, `/saveboard-vs-raindrop`. Positioning anchors on **live competitors (Raindrop.io)**, not Pocket (discontinued). See `marketing/offsite-listings.md`.

## Android release
- Version in `android/app/build.gradle`: `versionCode` (must increase) + `versionName`. **Current: versionCode 6 / 1.0.3.**
- Signing: gitignored `android/keystore.properties`. Gradle needs:
  `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`
- Build AAB:
  ```
  npm run build && npx cap sync android
  cd android && JAVA_HOME="<JBR above>" ./gradlew bundleRelease
  ```
  Output: `android/app/build/outputs/bundle/release/app-release.aab`
- Upload: Play Console → Production → Create release → **Upload** the AAB (or Add from library if already uploaded) → release notes → Start rollout. (Managed publishing off = auto-publish after Google review.)
- Builds are **cumulative** — a newer versionCode contains all prior changes; version codes need not be contiguous.

## iOS release (CLI workflow — no Xcode GUI needed)
- Versions in `ios/App/App.xcodeproj/project.pbxproj`: `CURRENT_PROJECT_VERSION` (build #) + `MARKETING_VERSION` — **4 entries each** (App Debug/Release + ShareExtension Debug/Release); keep all equal. **Current: 1.0.1 / build 13.**
- ⚠️ When the marketing version is "Ready for Distribution"/approved, that version train CLOSES — bump `MARKETING_VERSION` for any update (altool error 90186/90062 otherwise).
- `ShareExtension/Info.plist` uses `$(MARKETING_VERSION)`/`$(CURRENT_PROJECT_VERSION)` (must match parent app or App Store warns).
- Workflow:
  ```
  npm run build && npx cap sync ios
  cd ios/App
  xcodebuild -project App.xcodeproj -scheme App -configuration Release \
    -destination 'generic/platform=iOS' -archivePath build/App.xcarchive \
    -allowProvisioningUpdates archive
  xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build/export \
    -exportOptionsPlist ExportOptions.plist -allowProvisioningUpdates
  xcrun altool --upload-app -f build/export/App.ipa -t ios \
    -u artking81@hotmail.com -p <app-specific-password>
  ```
- Then App Store Connect (web) → Distribution → `+` new version → add build → "What's New" → Submit for Review. (TestFlight ≠ submission.)

## Native plugins (run `cap sync` after install)
`@capacitor/app` (appUrlOpen deep links), `@capacitor/browser`, `@capacitor/keyboard`,
`@capacitor-community/apple-sign-in`, `send-intent` (Android share-target receiver),
`@capacitor-community/in-app-review` (rating prompt).
- send-intent is patched (`patches/send-intent+7.0.0.patch`) to compile against project compileSdk (36).

## Supabase / data
- ⚠️ **Migrations must be applied to PROD manually** (Supabase dashboard SQL editor) **before** deploying client code that depends on them — the client has no migration runner. e.g. `categories.sort_order` had to be added before shipping board reorder.
- RLS model: `shared_boards`/`shared_board_views` via SECURITY DEFINER RPCs (`get_shared_board`, `increment_board_view`, `record_board_view`); no direct anon table access.
- Key tables: `links` (id,url,title,description,image,category,user_id,created_at,tags), `categories` (name,user_id,sort_order), `subscriptions`.
- Payments: Apple IAP on iOS, Stripe on web + Android.

## Conventions / gotchas
- `dist/` is gitignored but a few files (`dist/index.html`, `dist/sitemap.xml`) are tracked — Vercel rebuilds anyway, so committing dist isn't required.
- Commit to `main` directly (that's the deploy path). End commit messages with the Co-Authored-By trailer.
- In-app browsers (KakaoTalk etc.) block OAuth — `SharedBoardPage` detects them and offers an "open in app" deep link.
- Free plan limits in `FREE_LIMITS` (30 links, etc.). `isPro` gates Pro features.
- Match surrounding code style (dense one-liners in App.tsx handlers, Tailwind classes).
