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
| 1.0.8 | 20 | — | — | **iOS uploading** — YouTube in-app playback fix (WKWebView UA + IFrame Player API), billing-failure recovery, iPhone layout (safe-area top, bottom-nav spacing). Android unaffected by the video bug → separate later release | 2026-07-27 |
| 1.0.7 | 19 | 1.0.12 | 16 | **Both submitted for review** | 2026-07-19 |
| 1.0.6 | 18 | 1.0.11 | 15 | **LIVE** both stores | iOS 2026-07-17 |

---

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
