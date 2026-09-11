# SaveBoard — project guide for Claude

Visual, mobile-first bookmark/link-saver. Web (Vercel) + native iOS & Android (Capacitor).
Part of the **Creators Loft** studio (also PeriodVol). Founder: Mihee Youn — address as **대표님** in Korean.

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

## Versions & release notes
- **`CHANGELOG.md` is the version record — update it in the SAME commit that bumps a version.** It also carries the two commands that check what is actually live on each store. iOS and Android numbering are independent; never infer one from the other, and never state a live version from memory — check.
- **`store/release-notes.md` holds copy-paste-ready store notes (EN + KO).** Write them as part of preparing a release, not after. If a release has no user-facing change, say so plainly rather than inventing one.

## Android release
- Version in `android/app/build.gradle`: `versionCode` (must increase) + `versionName`. **Current: versionCode 22 / 1.0.18.**
- Signing: gitignored `android/keystore.properties`. Gradle needs:
  `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`
- Build AAB:
  ```
  npm run build && npx cap sync android
  cd android && JAVA_HOME="<JBR above>" ./gradlew bundleRelease
  ```
  Output: `android/app/build/outputs/bundle/release/app-release.aab`
- **인앱 결제(Play Billing)는 1.0.18/vc22 부터.** 안드로이드 구매는 `StoreKitPlugin.java`
  (Play Billing 7.1.1) 가 처리하고, **iOS 플러그인과 같은 JS 이름 `StoreKit` + 같은 메서드 3개**를
  노출한다 — `src/app/lib/storekit.ts` 는 어느 스토어인지 모른 채 그대로 쓴다. 상품 ID 만 갈린다:
  Apple `app.saveboard.pro.per.monthly`/`app.saveboard.pro.yearly`, Google `pro_monthly`/`pro_yearly`.
  ⚠️ **Play Console 은 BILLING 권한을 가진 빌드가 트랙에 올라가기 전까지 구독 상품 생성을 막는다**
  (Monetize → Subscriptions 가 "Create subscription" 대신 "Upload a new APK" 만 보여준다).
  그래서 순서가 빌드 업로드 → 상품 생성이지, 그 반대가 아니다. 상품이 없으면 `getProducts` 가
  빈 배열을 주고 앱은 기존 웹 결제 화면으로 조용히 내려간다.
- Upload: Play Console → Production → Create release → **Upload** the AAB (or Add from library if already uploaded) → release notes → Start rollout. (Managed publishing off = auto-publish after Google review.)
- Builds are **cumulative** — a newer versionCode contains all prior changes; version codes need not be contiguous.
- **Verifying an AAB — do not grep for a constant-folded URL.** `apiUrl()` builds
  `` `${PROD_URL}${path}` `` and esbuild does **not** fold that into a literal, so
  `grep "www.saveboard.app/api"` inside `base/assets/public/assets/*.js` returns
  **nothing even when the fix is in**. Grep for the two halves instead:
  `du="https://www.saveboard.app"` (the const) and the minified helper
  `function ec(t){return G1()?\`${du}${t}\`:t}` plus its call sites
  (`ec("/api/...")`, and `d(\`/api/metadata`) in the metadataFetcher chunk).
  ⚠️ The minified names (`ec`/`du`/`G1`/`d`) are **regenerated every build** — find
  the current ones by grepping for the literal `https://www.saveboard.app` and for
  `"/api/` , don't reuse the names above. A grep miss is not proof of absence.
- **Reading versions out of the AAB:** `base/manifest/AndroidManifest.xml` is
  *protobuf*, so `aapt2 dump xmltree` refuses it ("could not identify format of
  APK") and `strings` shows only the attribute names. Byte-grep it:
  `versionName` is followed by `\x1a\x06` + `1.0.16`, `versionCode` by
  `\x1a\x0220`. The plain-text merged manifest is also at
  `android/app/build/intermediates/packaged_manifests/release/processReleaseManifestForPackage/AndroidManifest.xml`.
- `jarsigner -verify` on a release AAB prints `jar verified.` then warns about an
  invalid/self-signed certificate chain and a missing timestamp. **That is normal**
  for our upload key — it is not a CA-chained cert. Only `jar verified.` matters.

## iOS release (CLI workflow — no Xcode GUI needed)
- Versions in `ios/App/App.xcodeproj/project.pbxproj`: `CURRENT_PROJECT_VERSION` (build #) + `MARKETING_VERSION` — **4 entries each** (App Debug/Release + ShareExtension Debug/Release); keep all equal. **Current: 1.0.11 / build 23.**
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
    -u artking81@hotmail.com -p @keychain:AC_PASSWORD
  ```
- **After upload, confirm processing** — `UPLOAD SUCCEEDED` only means the bytes
  arrived. altool prints a `Delivery UUID`; poll it:
  ```
  xcrun altool --build-status --delivery-id <uuid> \
    -u artking81@hotmail.com -p @keychain:AC_PASSWORD --output-format json
  ```
  `"build-status": "VALID_BINARY"` appears immediately; the one that matters is
  `app-store-attributes.processingState` going `PROCESSING` → `VALID`. (`--wait`
  blocks until it settles.) Only then does the build show up as selectable in
  App Store Connect.
- **Verifying the live version: `itunes lookup` storefronts disagree.** The `us`
  storefront can keep answering the *previous* version for a day or more after a
  release (2026-09-10: `au`/`gb`/`kr` all returned `1.0.10 2026-09-09` while `us`
  still said `1.0.9`). Treat a single-storefront answer as unreliable — check two
  or three, and let App Store Connect break the tie. Do **not** conclude the
  release did not go out because `us` is behind.
- **Verifying the IPA — same constant-folding trap as the AAB.** `apiUrl()` is
  minified to `` function ec(t){return G1()?`${du}${t}`:t} `` with
  `du="https://www.saveboard.app"`, so `grep "saveboard.app/api"` finds nothing
  even when the fix is in. Unzip the IPA and grep
  `Payload/App.app/public/assets/*.js` for the literal `https://www.saveboard.app`,
  for `fetch(ec("/api/` (the wrapped call sites), and confirm `fetch("/api/`,
  `fetch('/api/` and `` fetch(`/api/ `` are all **zero**. Lazy chunks import the
  helper by its export alias (`import{a as d}from"./index-*.js"` → `` d(`/api/metadata` ``),
  so follow the alias rather than expecting `ec` everywhere. Minified names are
  regenerated every build — re-derive them, never reuse these.
- **Upload auth:** app-specific password is in the login keychain as service `AC_PASSWORD`. ⚠️ Create it with `security add-generic-password -s AC_PASSWORD -a artking81@hotmail.com -w "<pw>" -U` — altool's own `--store-password-in-keychain-item` sets the label but not `svce` on Xcode 26, and lookup is by service, so it fails to find what it just stored. `-p` also needs a space before its value.
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
- **App update gate** (`src/app/components/UpdateGate.tsx` + `app_config` table): native-only. On launch it compares the running `App.getInfo().version` to per-platform `latest_version`/`min_version` in `app_config` → soft dismissible banner (below latest) or blocking "update required" screen (below min). Fail-safe (web / missing config / errors show nothing). **After every native store release, update `app_config`** (Supabase SQL editor): bump `latest_version` to the new version (shows the soft banner to everyone still behind); also bump `min_version` **only for critical releases** (forces the update). Keep `min_version` ≤ `latest_version`. Caveat: the prompt only reaches users who already run a build that contains UpdateGate (shipped first in iOS 1.0.5 / Android 1.0.10).

## Conventions / gotchas
- `dist/` is gitignored but a few files (`dist/index.html`, `dist/sitemap.xml`) are tracked — Vercel rebuilds anyway, so committing dist isn't required.
- Commit to `main` directly (that's the deploy path). End commit messages with the Co-Authored-By trailer.
- In-app browsers (KakaoTalk etc.) block OAuth — `SharedBoardPage` detects them and offers an "open in app" deep link.
- Free plan limits in `FREE_LIMITS` (30 links, etc.). `isPro` gates Pro features.
- Match surrounding code style (dense one-liners in App.tsx handlers, Tailwind classes).
