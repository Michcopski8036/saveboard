# SaveBoard — version log

⚠️ **iOS and Android version numbers are NOT in step.** iOS is on 1.0.x with its
own build number; Android has its own versionName plus a versionCode. Never
assume one from the other.

**The authority on what is live is the store, not this file.** Verify first:

```bash
# App Store
curl -s "https://itunes.apple.com/lookup?id=6770486850&country=au" \
  | python3 -c "import json,sys;d=json.load(sys.stdin)['results'][0];print(d['version'],d['currentVersionReleaseDate'][:10])"

# Play Store
curl -s -A "Mozilla/5.0" "https://play.google.com/store/apps/details?id=app.saveboard.saveboard&hl=en&gl=AU" \
  | grep -o '\[\[\["[0-9]\+\.[0-9.]*"\]\]' | head -1
```

Update this file in the same commit that bumps a version. Store-ready release
notes live in `store/release-notes.md`.

| iOS | build | Android | vc | Status | Date |
|---|---|---|---|---|---|
| — | — | 1.0.18 | 23 | **AAB built 2026-09-11** — Google Play 결제를 앱 안에 붙였다. (vc22 는 업로드에서 거부됨 — Billing 7.1.1 → 8.3.0 으로 올려 vc23 으로 재빌드) 이 빌드가 Play Console 에서 구독 상품을 만들 수 있게 하는 첫 빌드다(BILLING 권한이 있는 빌드가 트랙에 올라가야 Create subscription 버튼이 열린다). 상품이 아직 없으면 기존 웹 결제 화면으로 조용히 내려간다 | 2026-09-11 |
| — | — | 1.0.17 | 21 | **Play 심사 제출됨 2026-09-11**(창업자 업로드) — 안드로이드에서 Pro 결제를 시작조차 못 하던 것 수정(`startCheckout` 상대경로 + create-checkout CORS). 1.0.16 의 내용을 전부 포함 | 2026-09-10 |
| 1.0.11 | 23 | — | — | **iOS only — uploaded to App Store Connect 2026-09-10, NOT submitted for review** (founder submits). Same client code as Android 1.0.16 | 2026-09-10 |
| — | — | 1.0.16 | 20 | **업로드 전에 1.0.17 로 대체됨** — the app can finally reach our own API (expiring-thumbnail copy, account delete, in-app admin), TikTok share links read as video instead of "Article" | 2026-09-10 |
| 1.0.10 | 22 | 1.0.15 | 19 | **LIVE both stores** — iOS approved, released 2026-09-09 (App Store Connect + `itunes lookup` au/gb/kr all `1.0.10 2026-09-09`, re-checked 2026-09-10; the **us** storefront still answers `1.0.9` — stale CDN cache, not a second train). Play page store-verified 2026-09-10 | 2026-09-09 |
| 1.0.9 | 21 | 1.0.14 | 18 | **LIVE both stores** (store-verified 2026-09-09: iOS released 2026-08-14, Play shows 1.0.14) — Android payment-screen fix (Apple IAP view shown since 05-27 → paying impossible) + all Aug feature work, cumulative | 2026-08-13 |
| 1.0.8 | 20 | — | — | **iOS LIVE 2026-07-28** (store-verified 2026-08-13) — YouTube in-app playback fix (WKWebView UA + IFrame Player API), billing-failure recovery, iPhone layout (safe-area top, bottom-nav spacing). Android 1.0.13/vc17 was built 07-23 but **never uploaded** → superseded by 1.0.14/vc18 | 2026-07-27 |
| 1.0.7 | 19 | 1.0.12 | 16 | **Both submitted for review** | 2026-07-19 |
| 1.0.6 | 18 | 1.0.11 | 15 | **LIVE** both stores | iOS 2026-07-17 |

---

## iOS 1.0.11 (build 23) — built + uploaded 2026-09-10

**iOS only.** `android/app/build.gradle` was not touched — Android stays at
1.0.16 / vc20, whose AAB is built and waiting for the founder to upload.
Baseline is iOS 1.0.10 / build 22, **live since 2026-09-09** (verified on the
day: App Store Connect plus `itunes lookup` on au/gb/kr; the us storefront
still returns 1.0.9, which is a stale cache). That train is closed, so
MARKETING_VERSION moves to 1.0.11.

This build carries **exactly the client code that Android 1.0.16 carries** —
`7799d4d9`, `d95dad30` and the safe-area fix, all already on `main`. See the
Android 1.0.16 section below for the full write-up; the short version:

- **The app could not reach our own API at all** (`7799d4d9`). iOS runs the web
  view from `capacitor://localhost`, so a relative `fetch('/api/...')` never
  left the app. `apiUrl()` (`src/app/lib/urls.ts`) returns an absolute
  `https://www.saveboard.app` URL on native; 8 call sites converted. Unblocks:
  the in-app Admin screen, link titles/previews from our own `api/metadata`
  instead of a silent fallback to third-party Microlink (this is why YouTube
  saves came in titled "YouTube Video"), and account deletion from the app.
- **Expiring thumbnails are copied to our storage for the first time in the
  app.** 1.0.10's store notes already promised this, but the copy only ever ran
  on the web: `/api/proxy` had no CORS *and* the client used a relative URL.
  Server CORS deployed 2026-09-10; this build is the client half. ⚠️ Store
  notes must not call it a fix — for app users it starts working here.
- **TikTok cards were labelled "Article · N min read"** (`d95dad30`) because
  share-sheet links are `vt.tiktok.com` / `vm.tiktok.com` short links.
- Admin top bar no longer sits under the iOS status bar (safe-area top inset).

**Verified for this build:** `npm run build` typecheck gate passed; archive and
export succeeded; `Payload/App.app/Info.plist` and
`PlugIns/ShareExtension.appex/Info.plist` both read
`CFBundleShortVersionString 1.0.11` / `CFBundleVersion 23`; the bundled JS
contains the absolute API base with no bare `fetch("/api/` left; altool
returned `UPLOAD SUCCEEDED` (delivery `8c7f9f75-0b7c-488b-8a29-b8630b2f37da`)
and `altool --build-status` polled through to
`processingState: VALID` / `import-status: VALID` on App Store Connect.

**Not verified:** the IPA was not run on a simulator or device. The API fix was
checked by grep against the shipped bundle, not from the installed app.

**Not done on purpose:** not submitted for review, no store metadata changes,
`app_config` untouched. **After 1.0.11 goes live:** bump
`app_config.latest_version` (iOS `1.0.11`).

## 2026-09-12 — 인앱 결제가 4개월 반 동안 조용히 실패하고 있었다 (DB 수정, 빌드 불필요)

안드로이드 첫 실결제 테스트에서 드러났다. 구글 결제는 끝까지 성사되는데 Pro 가
열리지 않고, 성공인지 실패인지도 화면에 안 나왔다.

**근본 원인은 두 겹이다.**
1. 클라이언트 upsert 가 `source` 를 쓰는데 **`subscriptions` 테이블에 그 컬럼이 없다.**
   `GET /rest/v1/subscriptions?select=source` → `42703 column subscriptions.source
   does not exist`. (클라이언트가 쓰는 나머지 9개 컬럼은 전부 존재한다.) PostgREST 는
   없는 컬럼이 오면 요청 전체를 거부한다.
2. **supabase-js 는 에러를 throw 하지 않고 반환하는데, 두 호출부 모두 그 반환값을
   확인하지 않았다.** 거부가 통째로 삼켜지고 `onPurchaseSuccess()` → `onClose()` 가
   그대로 실행됐다. `api/stripe-webhook.ts` 는 진작 `if (error) throw` 를 하고 있었고,
   클라이언트만 구멍이었다.

**언제부터:** `source: 'apple'` 은 2026-05-27 `9706de4c`(Apple IAP 도입)에 들어왔고
그 뒤로 한 번도 바뀌지 않았다. 구매 호출부는 앱 전체에 하나뿐(`UpgradePage.tsx`)이라
**iOS 인앱 결제도 같이 실패하고 있었다.**

**피해 없음 — 확인됨.** App Store Connect → Trends/Sales 의 인앱 매출이 **0**이다
(누나 확인, 2026-09-12). 앱 안에서 실제로 산 사람이 아무도 없어서 4개월 반 동안
드러나지 않았다. 그 전에 "아이폰에서 Pro 가 잘 됐다"고 기억한 것은 웹(Stripe) 결제
또는 어드민 화면의 수동 부여였다 — 둘 다 `source` 를 쓰지 않아 정상 동작한다.

**고침**
- `supabase/migrations/20260912_subscriptions_source.sql` — 컬럼 추가 + 백필
  (`stripe_subscription_id` 유무로 `stripe`/`admin` 을 가른다 — 전부 stripe 로 칠하면
  어드민 부여 행이 거짓이 된다) + 기본값 `stripe`.
  ⭐ **이 SQL 만 적용하면 이미 스토어에 올라간 빌드가 새 빌드 없이 고쳐진다.**
- `UpgradePage.handlePurchase` / `App.handleRestorePurchases` — upsert 에러를 확인하고
  사용자에게 보여 준다. 결제 뒤에 실패하면 이미 돈을 낸 상태이므로 "설정 → 구매 복원"
  으로 안내한다. **다음 빌드부터.**

**교훈:** `supabase-js` 의 반환 에러를 안 보는 곳이 또 있는지는 별도로 훑어야 한다.
서버(`api/`)는 확인하고 클라이언트는 안 하는 비대칭이 이 버그를 만들었다.

## Android 1.0.18 (versionCode 23) — built 2026-09-11

**Google Play 결제를 앱 안에 붙였다.** 여태 안드로이드 앱에는 인앱 결제가 **설계상
아예 없었다** — iOS 는 StoreKit 으로 앱 안에서 사고, 안드로이드는 "웹에서 결제하세요"
화면을 띄웠다. 1.0.17 이 고친 건 그 웹 결제 버튼이 눌리지 않던 것이고, 앱 안에서
사는 길 자체는 이 빌드가 처음이다.

**구현** (`ad327b8e`)
- `android/.../StoreKitPlugin.java` — Play Billing 7.1.1. **iOS 플러그인과 같은 JS 이름
  (`StoreKit`)과 같은 메서드 3개**(getProducts / purchase / restorePurchases)를 노출해서
  `src/app/lib/storekit.ts` 가 플랫폼을 몰라도 되게 했다. 웹 레이어의 구매 흐름은 하나로 유지된다.
- `MainActivity.java` — `registerPlugin(StoreKitPlugin.class)` 을 **`super.onCreate()` 앞에**.
  뒤에 두면 브리지가 이미 만들어진 뒤라 등록이 안 먹는다.
- `storekit.ts` — 상품 ID 가 스토어마다 다르다. Apple `app.saveboard.pro.per.monthly` /
  `app.saveboard.pro.yearly`, Google `pro_monthly` / `pro_yearly`. `STORE_SOURCE` 도
  `apple` / `google` 로 갈라져 subscriptions 행에 어디서 산 건지 남는다.
- `UpgradePage.tsx` — 안드로이드도 IAP 화면으로 보낸다. **단, Play 에 상품이 아직 없으면
  `getProducts` 가 빈 배열을 주고, 그때는 기존 웹 결제 화면으로 조용히 내려간다.**
  콘솔 설정 전에 이 빌드가 나가도 지금보다 나빠지지 않게 하려는 장치다.

**Play 특성 중 StoreKit 과 달라서 물리는 것**
- 구독은 *오퍼*를 통해서만 살 수 있다 → 구매 플로우에 `offerToken` 이 필요하다.
- 3일 안에 acknowledge 하지 않은 구매는 구글이 **자동 환불**한다 → 도착 즉시 acknowledge.
- Play 는 클라이언트에 만료일을 주지 않는다 → `expiresDate` 는 null, `current_period_end` 도 null.

**⚠️ 이 빌드를 올리기 전에는 Play Console 에서 구독 상품을 만들 수 없다.** Monetize →
Subscriptions 가 "Create subscription" 대신 **"Upload a new APK"** 만 보여주는 이유가
그것이다. 콘솔은 `com.android.vending.BILLING` 권한을 가진 빌드가 트랙에 올라간 뒤에야
상품 생성을 연다. 순서: **1.0.18 을 Internal testing 에 업로드 → 상품 `pro_monthly` /
`pro_yearly` 생성 + Activate → License testing 에 계정 추가 → 실제 구매 테스트.**

**⚠️ vc22 는 업로드에서 거부됐다 — Play Billing 8.0.0 미만은 못 올린다.** Internal testing
업로드 화면이 에러로 막았다: *"Your app currently uses Play Billing Library version 7.1.1
and must update to at least version 8.0.0."* 이건 경고가 아니라 **업로드를 막는 에러**다.
7.1.1 → **8.3.0** 으로 올리고 vc23 으로 다시 빌드했다. 업로드된 versionCode 는 재사용할 수
없어서 번호도 같이 올라갔다(버전명은 1.0.18 그대로 — 아무에게도 나간 적이 없다).

**Billing 8 에서 깨진 곳 (하나)**: `queryProductDetailsAsync` 의 콜백이 `List<ProductDetails>`
대신 **`QueryProductDetailsResult`** 를 준다 → `getProductDetailsList()` 로 꺼낸다. 이 래퍼는
못 찾은 상품 id 도 `getUnfetchedProductList()` 로 알려 주는데, **상품이 Play Console 에 없거나
Active 가 아니면 여기로 빠진다** — 그때 빈 목록이 나오고, 그게 UpgradePage 가 웹 결제로
내려가는 조건이다.

**덤으로 붙인 것**: `enableAutoServiceReconnection()` (8.0.0 신규). 앱이 백그라운드로 갔다
오거나 Play 서비스가 갱신되면 결제 연결이 끊기는데, 이제 라이브러리가 알아서 다시 붙는다.

검증 (2026-09-11): `jarsigner -verify` → `jar verified.`, 번들 매니페스트 versionName
`1.0.18` / versionCode `22`, `com.android.vending.BILLING` 있음, dex 에 `StoreKitPlugin`
+ Play Billing 클래스, 웹 번들에 `pro_monthly` / `pro_yearly` / `"google"` 있음.
재검증 (vc23): `jar verified.`, versionName `1.0.18` / versionCode `23`, BILLING 있음,
dex 에 Billing 8 의 `QueryProductDetailsResult`.

## Android 1.0.17 (versionCode 21) — built 2026-09-10

**1.0.16 은 Play 에 올라가기 전에 이 버전으로 대체됐다.** 그 사이 iOS 1.0.11 을 만들다가
**안드로이드에서 Pro 결제를 시작조차 못 하던 것**을 찾았기 때문이다: `startCheckout` 이
상대경로 `/api/create-checkout` 을 부르는데 안드로이드 앱은 http://localhost 에서 돌아
서버에 닿지 않았고, 그 라우트만 CORS 도 없었다(create-portal 은 진작 열려 있었다).
커밋 99e18a86 — 클라이언트 절대주소 + 서버 CORS. iOS 는 IAP 라 해당 없음.

1.0.16 에 담겼던 것은 전부 포함한다(아래 참조).

## Android 1.0.16 (versionCode 20) — built 2026-09-10

**Android only.** iOS was untouched by *this* build and stayed at 1.0.10 /
build 22 (the pbxproj was not edited here). ⚠️ This section originally said
1.0.10 was "in the review queue" — wrong: it was **approved and released
2026-09-09**. iOS moved to 1.0.11 / build 23 later the same day (section above). Baseline is
Android 1.0.15 / vc19, live on Play (store-verified 2026-09-10). Everything
below merged to `main` today; the server halves are already deployed, this
build carries the client halves.

**The app could not reach our own API at all** (`7799d4d9`)

Native runs the web view from `http://localhost` (Android) /
`capacitor://localhost` (iOS), so a relative `fetch('/api/...')` never left the
app — it looked for that path inside the bundle, failed, and the failure ran
off into a silent fallback. `apiUrl()` (`src/app/lib/urls.ts`) now returns an
absolute `https://www.saveboard.app` URL on native; 8 call sites converted:
admin-stats (x2), admin-update-plan, seo-check, app-config (x2), metadata,
proxy image copy, delete-account. CORS was added to `api/proxy.ts` and
`api/delete-account.ts` in the same commit — an absolute URL without CORS is
still blocked by the browser.

What that actually unblocks:

- **Expiring thumbnails get copied for the first time in the app.** The
  Instagram / TikTok / X thumbnail copy that shipped in 1.0.15 only ever
  worked on the web: `/api/proxy` had no CORS *and* the client used a relative
  URL. ⚠️ Do not write this up as a fix in store notes — for app users it has
  never worked before this build.
- Link metadata now comes from our own `api/metadata` (TikTok oEmbed, etc.)
  instead of silently falling back to the third-party Microlink service.
- Account deletion works from inside the app.
- The in-app Admin screen loads instead of showing "The string did not match
  the expected pattern." Founder-only, so deliberately left out of store notes.
- Admin top bar now starts below the status bar (`safe-area-inset-top`, same
  value as `UpdateGate`).

**TikTok cards were labelled "Article · N min read"** (`d95dad30`)

Links coming out of the share sheet are TikTok short links
(`vt.tiktok.com` / `vm.tiktok.com`), and the video regex only matched
`tiktok.com/@user/video/<id>` — so a video was filed as an article.
`isTikTokUrl()` in `LinkCard.tsx` matches the short hosts too. A short link
carries no video id, so there is still no autoplay embed, but the card gets
the vertical ratio and the play button.

**Server side, already deployed — not carried by this build:** CORS on
`api/proxy` and `api/delete-account`. Verified live 2026-09-10:
`OPTIONS /api/proxy` → `200` with `access-control-allow-origin: *`.

**Not verified:** this AAB was not run on an emulator or device. The API fix
was checked against prod with curl and against the built bundle by grep, not
from the installed app.

**After Play goes live:** bump `app_config.latest_version` (Android `1.0.16`).
Not done at build time on purpose, and not done in this commit.

## iOS 1.0.10 (build 22) / Android 1.0.15 (versionCode 19) — built 2026-09-09

Baseline for both platforms is 1.0.9/build 21 and 1.0.14/vc18, both live
(iOS lookup: `1.0.9 2026-08-14`; Play page: `1.0.14`). The 1.0.9 train is
closed, so MARKETING_VERSION moves to 1.0.10. Everything below has been live
on the web since it merged; this build is what carries it to the apps.

**Sharing into SaveBoard**

- Android: after saving from the share sheet, SaveBoard minimises and you
  land back in the app you shared from — no more being stranded in SaveBoard
  (`5c51f544`, `leaveAfterShareSave` in `App.tsx`; only on the send-intent
  path, so a normal launch is unaffected).
- TikTok links get a real title and thumbnail through TikTok's oEmbed
  (`73a9a033`, `api/metadata.ts`). If the lookup fails the API returns a stub
  instead of hanging the save (`971e8bc4`).
- Instagram / Facebook / TikTok / X thumbnails are signed CDN URLs that expire
  within days, after which the card lost its preview. After the card is
  created the client asks `api/proxy?mode=image` to copy the image into our
  storage and rewrites `links.image` to the stored copy (`bd5d7e16`,
  `0ac4359b`, `EXPIRING_IMAGE_HOSTS` in `App.tsx`). Copy happens after insert
  so a slow copy never delays the save.

**Also in this build**

- Update banner (`UpdateGate`) starts below the status bar instead of under
  it (`63fa55d6`, safe-area top inset).
- Links on a shared board you were invited to no longer count against your
  own Free saves quota (`082ce92d`); viewer → member bridge on the `/team`
  invite page (`0fb9ae79`, needs the `20260819_board_invite_preview.sql`
  migration — applied to prod 2026-08-19 with the web deploy).

**Not in the apps (web/server only):** guides/SEO/blog work, admin-stats
changes, API region move to icn1 — none of it is client code the app bundles.

**After both stores go live:** bump `app_config.latest_version` (iOS
`1.0.10`, Android `1.0.15`). Not done at build time on purpose.

## iOS 1.0.9 (build 21) / Android 1.0.14 (versionCode 18) — built 2026-08-13

Cumulative catch-up release. Baselines differ per platform: iOS ships everything
since 1.0.8/build 20 (archived 2026-07-27); Android's last live build is
1.0.12/vc16 (2026-07-19) — the prepared 1.0.13/vc17 AAB was never uploaded, so
its changes ship here and vc17 is skipped (codes need not be contiguous).

**Headline fix — Android payments were impossible since 2026-05-27** (`e960433b`):
since `9706de4c` the UpgradePage gated the Apple IAP view on
`isNativePlatform()`, so Android also got the iOS StoreKit screen — the plugin
has no Android side, prices never load, no purchase button. Now branched on
`getPlatform()`: iOS keeps IAP; Android shows a web-payment notice (Play billing
policy bars in-app Stripe checkout → plain-text pointer to www.saveboard.app);
web keeps the Stripe cards. BillingPage: Android reaches the Stripe portal via
`PROD_URL` in the system browser; `create-portal` CORS now allows the Android
native origin.

**Also new in these builds** (everything landed on `main` since late July):

- Startup performance: 25–73 s spinner → 1.5–4.7 s (`getSession()` no longer
  blocks forever; effect deps on `[userId]` not `[user]`)
- Sidebar pin/collapse
- Card design language: memo text cards, 2 px tone-on-tone accent strip, favicon
  tiles in kanban, home view toggle, memo-aware edit modals, long-form memo editor
- Reminders (Pro) — resurface a saved link at a chosen time
- Clean up links (Pro) — duplicate + broken-link finder
- Pinned announcement cards; Team viewer (view-only) roles
- Unlimited saves on Pro/Team; plan-aware usage bars and plan badges
- Native first-run intro instead of the web landing page

## iOS 1.0.8 (build 20) / Android 1.0.13 (versionCode 17) — prepared 2026-07-22

**iOS layout — two separate causes, both fixed**

- **White bands above and below the content.** `capacitor.config.json` set
  `ios.contentInset: "always"`, so WKWebView applied its own safe-area insets —
  while the app was already handling them in CSS (`App.tsx` header pads with
  `env(safe-area-inset-top)`, `BottomNav` renders a spacer of
  `env(safe-area-inset-bottom)`). Inside an inset WebView those `env()` values
  resolve to **0**, so both CSS spacers collapsed and the strip left over by the
  WebView's own inset rendered as page background. Set to `"never"`: the WebView
  runs edge to edge, `env()` gets real values back, and the CSS that was already
  written for this does the job. Android has no equivalent setting and is
  unaffected.
- **The bottom bar was taller than other apps' — and it was.** The button row was
  `h-16` (64pt) against the ~49pt content height of a system `UITabBar`. With the
  safe-area spacer that came to 98pt where iOS uses 83pt. Now `h-12` (48pt), for a
  measured **82.3pt** total. Still clears the 44pt minimum touch target.
  The remaining ~34pt below the labels is the home-indicator region and cannot be
  removed — every iOS app fills it with the bar's background.
  Measured on an iPhone 17 Pro simulator by sampling the screenshot at the left
  edge, where no button content interferes: 98.3pt before, 82.3pt after.

**Billing reaches native for the first time**

Everything in the web-only section below — the Stripe webhook 500s, the recovery
path for `past_due` subscribers, the plain-language explanation of a lapsed plan,
the usage bars showing the correct limits, the brand-palette pass and the
payment-failure banner — has been live on the web since 2026-07-20 but was in no
native build. `npx cap sync` picks it all up here. **For app users this is the
substantive half of the release**, and the store notes lead with it.

## Web-only — Stripe billing fixes, 2026-07-20

No version bump: these shipped straight to production via `main` (commits
`7cfc1001`, `88e11593`, `874f2858`, `737cda09`, `f350f2d6`, `edec37c6`).
Not yet in any native build — `npx cap sync` on the next release picks them up.

**The bug that started it:** every `customer.subscription.updated` delivery had
been returning 500 since 2026-07-16 (14/14 failed that week). Stripe moved
`current_period_end` off the Subscription object and onto its items in API
version `2025-03-31.basil`; the destination runs `2026-04-22.dahlia`, so
`api/stripe-webhook.ts` read `undefined`, and `new Date(NaN).toISOString()`
threw `RangeError: Invalid time value`. Read it from `sub.items.data[0]` now,
and store `null` rather than throwing if it is ever missing.

**Silent-failure fix in the same file:** supabase-js returns errors instead of
throwing, so a failed `subscriptions` upsert/cancel used to return 200 and be
lost. Those now throw → 500 → Stripe retries.

**What the outage exposed (all pre-existing):**

- `BillingPage` gated "Manage Billing & Payments" on `status === 'active'`, so
  `past_due` users — the only people who need to fix a card — could not reach
  the Stripe portal at all. A failed payment was a dead end with no recovery
  path in the app. Now shown for `past_due`/`unpaid`/`incomplete` as a primary
  "Update Payment Method" action.
- The plan card printed the raw Stripe status (`past_due`) in red. Replaced
  with "Payment issue" plus a sentence explaining the payment did not go
  through, that updating the card restores Pro, and that nothing was deleted.
- Usage bars showed the Pro limits while access was gated on `active`, so a
  lapsed plan read "87 / 300" while actually capped at 30. They now show the
  free limits whenever the subscription is not active.
- Billing used `#EF4444`/`#DC2626`, reds that appear nowhere else in the app.
  Moved onto the brand palette — coral `#F87171` for over-limit/attention
  states, purple gradient for the primary action. `BRAND_PURPLE`/`BRAND_CORAL`
  consts at the top of `BillingPage.tsx`; keep them in step with `UpgradePage`.

**New:** a payment-failure banner under the app header for
`past_due`/`unpaid`/`incomplete`, linking to Billing. EN/KO/FR strings.

**Policy decision:** Pro access stays gated strictly on `status === 'active'`
— no grace period for `past_due`. Deliberate; do not "fix" this by adding
`past_due` to the `isPro` check. The banner is the mitigation instead.

**Verified end to end:** after the card was updated, Stripe retried, the webhook
took the live event, and the row went `past_due` → `active` with a real
`current_period_end`. Not a manual resend — actual traffic.

**Still open:** Stripe Health showed 3 failed `invoice.payment_failed`
deliveries, but this destination does not subscribe to that event — so another,
probably stale, event destination likely exists. Never checked the Event
destinations list.

---

## iOS 1.0.7 / Android 1.0.12 — both submitted for review 2026-07-19

**User-facing:** nothing. This is a maintenance release; do not oversell it in
the store notes.

**Why ship it anyway:** it is the first native build that records the signed-in
user's own platform, locale and a coarse `last_seen` heartbeat on their own auth
record, which is what makes the admin dashboard's device, location and "signed in
now" panels work for app users. Until this ships, those panels only see web
users. See `src/app/lib/profileMeta.ts`.

**Also in this build**
- Admin: `artking81@hotmail.com` added; the allowlist that was duplicated across
  five files is now one server copy per endpoint plus `src/shared/admins.ts`.
- Admin System tab: the update gate (`app_config`) is editable in the UI, so a
  release no longer needs hand-written SQL. It rejects `min_version` above
  `latest_version`, which would hard-block every user.
- Admin Users tab: search, column sorting, device/location columns.
- Removed a stray 643 MB nested clone of this repo from the working tree.

## iOS 1.0.6 / Android 1.0.11 — live since 2026-07-17

Drag-handle z-index fix, root error boundary, R8 shrinking (5.5 → 3.7 MB),
edge-to-edge for targetSdk 36, native CORS fix for invite emails, and the
in-app update gate (soft banner + forced-update screen).
