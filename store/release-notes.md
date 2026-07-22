# SaveBoard — store release notes

Copy-paste ready. Same text works for the App Store "What's New" and the Play
Console release notes. Play's limit is 500 characters per language.

---

## iOS 1.0.8 / Android 1.0.13

Leads with the billing recovery path, because that is the change users can
actually feel: a failed payment used to be a dead end with no way to fix a card
from inside the app. The iOS layout fix is real but secondary, and Android users
should not be told about a change they will not see — hence the shared wording
below stays platform-neutral.

### English

```
If a payment ever fails, SaveBoard now explains what happened and lets you update your card right from the Billing screen — no more dead ends, and nothing you saved is ever deleted.

Also: cleaner, tidier layout on iPhone, and a smoother billing screen.
```

### 한국어

```
결제가 실패했을 때 무슨 일이 있었는지 알려드리고, 결제 화면에서 바로 카드를 변경할 수 있게 했어요. 저장하신 링크는 어떤 경우에도 삭제되지 않아요.

그리고 아이폰에서 화면이 더 깔끔하게 정리됐어요.
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
