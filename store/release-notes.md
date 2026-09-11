# SaveBoard — store release notes

Copy-paste ready. Same text works for the App Store "What's New" and the Play
Console release notes. Play's limit is 500 characters per language.

---

## Android 1.0.18 (Android only)

⚠️ **이 빌드는 먼저 Internal testing 으로 간다, Production 이 아니다.** Play Console 에서
구독 상품(`pro_monthly` / `pro_yearly`)을 만들려면 BILLING 권한을 가진 빌드가 트랙에 먼저
올라가 있어야 하고, 상품을 만들고 실제 구매를 테스트해 본 뒤에 Production 으로 올린다.
그래서 **아래 노트는 Production 승격 때 쓸 것**이고, Internal testing 단계에서는 필요 없다.

노트가 "결제가 고쳐졌다"가 아니라 "앱 안에서 살 수 있다"라고 말하는 이유: 안드로이드
앱에는 인앱 결제가 **원래 없었다**. 고친 게 아니라 없던 길이 생긴 것이다.

### English

You can now upgrade to Pro without leaving the app. Android purchases go
through Google Play, the same way the iPhone app uses the App Store — pick
monthly or yearly, pay with the card already on your Google account, and Pro
unlocks straight away. If you already subscribed on the web, nothing changes
and you do not need to buy again.

### 한국어

이제 앱을 벗어나지 않고 Pro 로 업그레이드할 수 있습니다. 안드로이드 결제는 구글 플레이로
처리돼요. 아이폰 앱이 앱스토어를 쓰는 것과 같은 방식입니다. 월간이나 연간을 고르고 구글
계정에 등록된 카드로 결제하면 바로 Pro 가 열립니다. 웹에서 이미 구독 중이라면 그대로
유지되고, 다시 결제할 필요는 없습니다.

---

## iOS 1.0.11 (iOS only)

iOS-only build; Android stays at 1.0.16 (its AAB is built and waiting to be
uploaded). The client code is **identical** to Android 1.0.16, so the notes are
deliberately the same text — one release, two stores, one story.

⚠️ Same wording rule as Android 1.0.16: this does **not** say the thumbnails
were "fixed". 1.0.10's App Store note already promised the copy, but it only
ever ran on the web (`/api/proxy` had no CORS and the client used a relative
URL, which never leaves the app on native). For iPhone users 1.0.11 is the
**first** build where it works, so the note describes what it does, not what it
repairs.

The in-app Admin fix, the API plumbing and the safe-area tweak are left out on
purpose — admin is founder-only and the rest is invisible.

### English

```
Previews that stay put. Instagram, TikTok, Facebook and X host their thumbnails on links that expire after a few days, which left your cards blank — SaveBoard now keeps its own copy of the image, so the preview stays. TikTok links you share in are also recognised as videos now: the right vertical shape and a play button, instead of being filed as an article. Fetching titles and previews is more reliable too.
```
(411 characters.)

### 한국어

```
미리보기가 그대로 남아 있어요. 인스타그램·틱톡·페이스북·X 썸네일은 며칠 뒤 만료되는 주소에 올라와 있어서 카드가 비어 보이곤 했는데, 이제 SaveBoard가 이미지 사본을 직접 보관합니다. 공유해서 넣은 틱톡 링크도 영상으로 알아봐요 — 글로 분류되던 것이 세로 비율과 재생 버튼이 붙은 영상 카드로 표시됩니다. 제목·미리보기를 가져오는 것도 더 안정적입니다.
```
(204 characters.)

---

## Android 1.0.16 (Android only)

Android-only build; iOS stays at 1.0.10. Leads with thumbnail persistence and
TikTok cards, the only two changes a user can see.

⚠️ Wording deliberately does **not** say "fixed" or "no longer disappears" for
the thumbnails. 1.0.15's note already promised that, but the copy only ever ran
on the web (`/api/proxy` had no CORS and the client used a relative URL, which
never leaves the app on native). For app users this is the **first** build
where it works, so the note describes what it does, not what it repairs.

The in-app Admin fix and the API plumbing are left out on purpose — admin is
founder-only, and the rest is invisible.

### English

```
Previews that stay put. Instagram, TikTok, Facebook and X host their thumbnails on links that expire after a few days, which left your cards blank — SaveBoard now keeps its own copy of the image, so the preview stays. TikTok links you share in are also recognised as videos now: the right vertical shape and a play button, instead of being filed as an article. Fetching titles and previews is more reliable too.
```
(411 characters — Play limit is 500.)

### 한국어

```
미리보기가 그대로 남아 있어요. 인스타그램·틱톡·페이스북·X 썸네일은 며칠 뒤 만료되는 주소에 올라와 있어서 카드가 비어 보이곤 했는데, 이제 SaveBoard가 이미지 사본을 직접 보관합니다. 공유해서 넣은 틱톡 링크도 영상으로 알아봐요 — 글로 분류되던 것이 세로 비율과 재생 버튼이 붙은 영상 카드로 표시됩니다. 제목·미리보기를 가져오는 것도 더 안정적입니다.
```
(204 characters — Play limit is 500.)

---

## iOS 1.0.10 / Android 1.0.15

Leads with sharing, because that is where every change in this build lands.
The Android "go back to the app you came from" line is real only on Android;
the wording keeps it neutral ("gets out of your way") so the same text is true
on iOS, where the share extension already dismissed itself. The thumbnail
persistence is the fix people were reporting as "my Instagram card went blank".

### English

```
Saving from other apps just got smoother. Share a TikTok link and SaveBoard now picks up the title and thumbnail. Instagram, Facebook, TikTok and X previews no longer disappear after a few days — SaveBoard keeps its own copy. After you save from the share sheet, SaveBoard gets out of your way and returns you to what you were doing. Plus small layout fixes.
```

### 한국어

```
다른 앱에서 저장하기가 더 매끄러워졌어요. 틱톡 링크를 공유하면 제목과 썸네일을 바로 가져옵니다. 인스타그램·페이스북·틱톡·X 미리보기가 며칠 뒤 사라지던 문제도 해결 — SaveBoard가 직접 사본을 보관해요. 공유 시트에서 저장하면 SaveBoard가 물러나고 하던 앱으로 돌아갑니다. 자잘한 화면 수정도 포함돼 있어요.
```

---

## iOS 1.0.9 / Android 1.0.14

Leads with startup speed — the change every user feels on every launch. The
Android payment-screen repair is stated from the user's side ("clearer payment
guidance"), not as the bug it was. Wording is platform-neutral so the same text
works on both stores.

### English

```
SaveBoard now opens in seconds — no more long wait at launch. New: pin the sidebar open, set reminders on saved links (Pro), and clean up duplicate or broken links in one tap (Pro). Memo cards have a cleaner text-first look, and board owners can pin announcements to the top. Payment and plan guidance in the app is clearer too.
```

### 한국어

```
SaveBoard가 이제 몇 초 만에 열려요 — 시작할 때 오래 기다리지 않아도 됩니다. 새 기능: 사이드바 고정, 저장한 링크 리마인더(Pro), 중복·깨진 링크 한 번에 정리(Pro). 메모 카드는 텍스트 중심으로 더 깔끔해졌고, 보드 주인은 공지 카드를 맨 위에 고정할 수 있어요. 앱 안의 결제·플랜 안내도 더 명확해졌습니다.
```

---

## iOS 1.0.8 / Android 1.0.13

Leads with the billing recovery path, because that is the change users can
actually feel: a failed payment used to be a dead end with no way to fix a card
from inside the app. The iOS layout fix is real but secondary, and Android users
should not be told about a change they will not see — hence the shared wording
below stays platform-neutral.

### English

```
YouTube videos play inside SaveBoard again — tap a video card and it plays right there, no bouncing out. And if a payment ever fails, SaveBoard now explains what happened and lets you update your card from the Billing screen — nothing you saved is ever deleted. Plus a cleaner, tidier layout on iPhone.
```

### 한국어

```
유튜브 영상이 SaveBoard 안에서 다시 재생돼요 — 영상 카드를 누르면 바로 그 자리에서 재생됩니다. 결제가 실패하면 무슨 일인지 알려드리고 결제 화면에서 바로 카드를 변경할 수 있어요(저장한 링크는 삭제되지 않아요). 아이폰 화면도 더 깔끔해졌어요.
```

---

## iOS 1.0.7 / Android 1.0.12

This release has **no user-facing change** — it exists so the app records the
device and locale needed by the admin dashboard. The notes below say that
honestly rather than dressing it up; users notice invented features that aren't
there, and it costs more trust than a dull release note ever does.

### English

```
Behind-the-scenes maintenance to keep SaveBoard running smoothly. No changes to how the app works.
```

### 한국어

```
안정적인 사용을 위한 내부 개선입니다. 사용 방식에 바뀐 점은 없습니다.
```

---

## Template for the next release

Lead with what a user will actually notice, in their words — "Links you save
from other apps now land in the right board", not "fixed onNewIntent handling".
One to three lines. Skip anything invisible to them.

If the release is genuinely internal, reuse the maintenance wording above rather
than inflating it.
