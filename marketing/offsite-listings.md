# SaveBoard — Off-site listing copy

Paste-ready copy for directory listings and launches. Keep the name and
description **consistent everywhere** — LLMs (ChatGPT, Perplexity, Gemini,
Google AI Overview) recognise a product as an entity when the same name +
description appear across high-authority sources.
**`public/llms.txt` is the other half of this — change one, change both.**

## ⚠️ 2026-08-12 — 프레임을 옮겼다: 개인 북마크 → 단톡방 공유 보드

이 파일은 원래 부제가 "(Raindrop-anchored)"였고, 첫 문장이 **"Raindrop·mymind 대안"**이었다.
그 프레임의 문제: **Raindrop을 그 카테고리에서 이길 방법이 없다**(웹앱·브라우저 확장·연차 축적 기능).
그리고 랜딩(`LandingPage.tsx`)은 이미 **학부모·단톡방·팀** 기준으로 쓰여 있어서
바깥 문구와 랜딩이 서로 다른 말을 하고 있었다.

**바꾼 근거(2026-08-12 실사용 관찰, [[saveboard-shared-board-real-usage]]):**
누나가 아들 농구팀 **학부모 왓츠앱 단톡방**에 SaveBoard 보드를 만들어 공유했고,
**본인은 매주 그 보드로 돌아가고**, 받은 학부모들은 **가입 없이 열어보기만** 했다.
→ 팔아야 할 것은 "링크 저장"이 아니라 **"단톡방에서 링크가 죽는 문제"**이고,
**반복 일정(시즌·학기·여행)에 묶인 보드는 안 죽는다**는 것이 리텐션 스토리다.

⛔ **채택 규모를 주장하지 말 것.** 표본은 누나 한 명이다. 용도를 설명하는 것까지만 허용.
⛔ 공유 보드 관련해 **무료 멤버의 저장 한도를 약속하지 말 것** ([[saveboard-shared-board-limit-bug]]).

**Raindrop·mymind·Pocket 언급은 지우지 않고 뒤로 뺐다** — `/raindrop-alternative`·
`/mymind-alternative`·`/pocket-alternative` 페이지가 그 연결로 유입을 받는다.
다만 **첫 문장이 제품을 규정**하므로, 지는 카테고리로 시작하지 않는다.
⚠️ 단 **아웃리치 각도는 여전히 Pocket이 주력이다** — 2026-08-12에 보낸 4통 중 3통이
Pocket 대안 기사였다(`listicle-outreach-drafts.md`). 정체성 앵커(살아있는 경쟁자)와
아웃리치 각도(Pocket 난민)는 **다른 축이고 둘 다 유효하다.**

Landing pages to link to:
- https://www.saveboard.app
- https://www.saveboard.app/raindrop-alternative
- https://www.saveboard.app/saveboard-vs-raindrop
- https://www.saveboard.app/pocket-alternative
- https://www.saveboard.app/blog/save-links-from-whatsapp

---

## Canonical assets (use these fields everywhere)

- **Name:** SaveBoard
- **Tagline:** The links your group chat keeps losing — saved to one board everyone can open.
- **Category / tags:** Bookmark Manager, Visual Bookmarks, Link Saver, Shared Boards, Save for Later, Read It Later
- **Alternative to:** Raindrop.io, mymind, Instapaper, Pocket
- **Platforms:** iOS, Android, Web (the web build is the same phone-shaped app, not a desktop-first one)
- **License / pricing:** Freemium — free up to 30 saves and 5 boards, no card; Pro A$5.49/month or A$34.99/year; Team A$9.49/month
- **Website:** https://www.saveboard.app

**Short description (≈60 words):**
> SaveBoard is a mobile-first bookmark app built around the links that arrive in group chats. Save from the share sheet in any app — Instagram, YouTube, WhatsApp, your browser — in one tap, organise them into visual boards, and share a whole board as a link that opens without an account. iOS, Android and web. Free to start.

**One-liner:**
> The links your group chat keeps losing, on one board everyone can open.

**⚠️ 통화 표기:** 위 금액은 **호주달러 한 티어**다. 미국 매체엔 `A$`를 붙여 명시하되
**다른 통화와 나란히 비교하지 말 것**(환율에 따라 달라져 사실로 주장할 수 없다).
숫자는 `public/llms.txt`·`UpgradePage.tsx`와 일치해야 한다.

**짧은 변형 (디렉터리 한 줄 칸용):**
> A mobile-first visual bookmark manager. Save links from any app's share sheet into boards you can share as a link.

---

## AlternativeTo  (highest priority for "alternative to" queries)

1. Create an account, search "SaveBoard" — if missing, **Add application**.
2. Fill: name, short description (above), platforms (iOS/Android), license (Freemium), tags.
3. On the **Raindrop.io** page, "Suggest as alternative" → SaveBoard (and on mymind / Instapaper pages too).
4. Get a handful of early likes so it ranks on the "Raindrop alternatives" list (sorted by likes).

Description to paste: the short description above.

---

## Product Hunt

- **Name:** SaveBoard
- **Tagline (≤60 chars):** The mobile-first alternative to Raindrop.io
- **Description:**
  > Save links from any app's share sheet in one tap and organise them into visual boards. SaveBoard is the mobile-first, visual bookmark manager — built for the way you actually save links: on your phone, from Instagram, YouTube, and group chats. Free to start.
- **Topics/tags:** Productivity, Bookmarking, Android, iOS
- Prepare logo + 3–5 screenshots (boards view, share-sheet save, a single card). Schedule a launch day and gather upvotes/comments early.

---

## Slant

Add SaveBoard as an option to questions like:
- "What are the best Raindrop.io alternatives?"
- "What is the best mobile bookmark manager?"
- "What are the best visual bookmarking apps?"

Pros to list: mobile-first, one-tap share-sheet saving, visual cards, simple boards, free tier.
Cons (be honest): no browser extension yet, free tier capped at 30 links.

---

## Reddit  (highest impact for LLM citation — be authentic, not spammy)

Subreddits: r/productivity, r/bookmarks, r/androidapps, r/iosapps, r/datacurator

- Answer existing threads ("best Raindrop alternative?", "mobile bookmark manager?") with a genuine, balanced reply. Disclose you're the maker.
- One experience-led post is fine; put the link once at the end, not in the title.
- Honesty wins: concede Raindrop is better for desktop power users; position SaveBoard for mobile/visual/simple.

---

## SaaSHub  (2026-09-03 신규 — free self-serve, active)

Full submission copy: `marketing/saashub-submission-saveboard.md`. Free, no account tier
required to list. Already carries a "Bookmark Manager" alternatives page with Raindrop.io,
Pinboard, Bookmark OS etc. — SaveBoard is not currently listed. Submission mechanics
(exact field names, character limits) were not independently verified this run — see
`marketing/directory-targets-2026-09-03.md`.

## G2 / Capterra  (lower priority — B2B review sites, consumer app fit is weak)

Optional: create a Capterra/G2 product profile so the entity exists, but don't
invest heavily until you have users willing to leave reviews. AlternativeTo +
Reddit + Product Hunt are the higher-leverage channels for a consumer app.

---

## ⚠️ 2026-09-03 — SaaSHub 신규 타깃 발굴 (네트워크 제약 있었음)

이번 실행은 `WebFetch`/`curl`이 이 세션의 네트워크 정책으로 전부 차단됐다(`EGRESS_BLOCKED`,
`saveboard.app` 자기 사이트 포함). 그래서 이번 배치는 **WebSearch 요약만으로 조사**했고, 기존
배치들의 기준("실제 페이지를 열어 다시 읽는다")을 못 지켰다 — 그래서 특정 매체 글을 인용하는
신규 아웃리치 피치는 만들지 않았고, **자체 서술 캐노니컬 카피만 붙여넣는 셀프서브 디렉터리
제출**로 범위를 좁혔다. 자세한 근거·거절한 후보 목록은 `marketing/directory-targets-2026-09-03.md`.

- **SaaSHub** (`saashub.com`) — 무료 셀프서브 SaaS 디렉터리, 2026년 갱신 확인됨(북마크·생리앱
  카테고리 둘 다 활성). Raindrop.io 등 경쟁사는 등재돼 있고 SaveBoard는 없음.
  초안: `marketing/saashub-submission-saveboard.md`. 폼 정확한 필드명은 미확인(페이지 직접 못 엶)
  — 제출 전 실제 폼을 열어 확인할 것.
- PeriodVol용 SaaSHub·MyHealthApps.net 초안도 이번에 같이 썼다(라우틴 지침상 PeriodVol 몫도
  이 저장소에 쓴다) — `marketing/saashub-submission-periodvol.md`,
  `marketing/periodvol-myhealthapps-submission.md`. **PeriodVol 저장소엔 push 권한이 없어서
  그쪽 `offsite-listings.md` 체크리스트에는 아직 반영 안 됨** — 실행하면 그쪽 파일에도 옮겨 적을 것.

## Priority order (2026-08-12 갱신)

**리스티클 아웃리치 > AlternativeTo > Reddit > Product Hunt > (G2 / Capterra).**
~~Slant~~는 **접었다** — 5번 절 참조(생리앱 질문 0건, 검색 500 에러, 관리 안 되는 개발자 도구 사이트).

여전히 유효한 판단: **가장 큰 레버는 구글 상위 리스티클에 이름을 올리는 것**이다 — LLM이 그걸 종합한다.

### 진행 상황
- ✅ **리스티클 아웃리치 4통 발송 (2026-08-12)** — Cloudwards · How-To Geek · BuyerSprint · MakeUseOf.
  초안·근거는 `listicle-outreach-drafts.md`, 타깃 조사는 `listicle-targets-2026-08-11.md`.
  각도의 주력은 **Pocket 종료 이후 리스티클**이다. 📝 폼 2건(Zapier 저자 폼·HashDork) 미제출.
  ⛔ TechCrunch(수신거부 명시) · Tool Finder($39+ 유료 = 광고, 별도 예산 판단).
- ✅ **AlternativeTo 제출 + 대안 7개 연결 + $5 우선심사 (2026-08-12)** → [[saveboard-alternativeto-submitted]].
  ⭐ **앱만 등록하고 대안을 안 걸면 아무 일도 안 일어난다**(사이트 자체 경고). 승인 전 링크 공유 금지.
- ☐ **Reddit** — ⚠️ 규칙은 "홍보 금지"가 아니라 **"홍보만 하는 계정 금지"**다. 브랜드명 계정은
  뭘 해도 스팸으로 읽힌다(`u/PeriodVol`이 그 경우). 실제 사람이 참여하다 이해관계를 밝히고
  언급하는 건 대부분 허용된다. 카르마는 **댓글로** 쌓는다(글은 위험, 링크 금지).
- ☐ Product Hunt · G2/Capterra — 미착수.
- 📝 **SaaSHub (2026-09-03 초안)** — `marketing/saashub-submission-saveboard.md`. 미제출.
