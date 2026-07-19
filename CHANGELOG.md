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
| 1.0.7 | 19 | 1.0.12 | 16 | iOS **submitted for review**; Android AAB awaiting upload | 2026-07-19 |
| 1.0.6 | 18 | 1.0.11 | 15 | **LIVE** both stores | iOS 2026-07-17 |

---

## iOS 1.0.7 / Android 1.0.12 — iOS submitted for review 2026-07-19; Android not yet uploaded

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
