# BRAND — SaveBoard

> 이 파일은 마케팅 에이전트 전원이 작업 시작 전에 읽는다.
> 톤·타겟·금칙어를 바꾸려면 여기만 고치면 전 에이전트에 반영된다.
> **"없음(홍보 금지)" 목록은 brand-qa의 반려 기준이다. 추측으로 채우지 말 것.**

## 제품

- **이름**: SaveBoard
- **한 줄**: 링크를 보드에 시각적으로 모아두는 북마크 앱
- **사이트**: https://www.saveboard.app (⚠️ canonical은 **www 포함**)
- **플랫폼**: 웹 · iOS · Android

## 타겟

- **주 타겟**: 단톡방·DM으로 링크를 계속 받는데 나중에 못 찾는 사람.
  특히 아이 학원·스포츠 일정 링크를 단톡방으로 받는 학부모, 자료를 쌓아두는
  1인 창업자/기획자.
- **이들이 실제로 쓰는 말**:
  - "그 링크 어디 갔지"
  - "나에게 보내기 해놨는데 못 찾겠어"
  - "카톡에서 스크롤 내리다 포기함"
  - "북마크는 저장만 하고 다시 안 봄"
- **이들이 있는 곳**: 네이버 카페(학부모·지역), Reddit r/productivity ·
  r/bookmarks, 스레드, Pocket 종료 관련 커뮤니티

## 톤

- **이런 느낌**: 담백하고 구체적. 실제 상황을 먼저 보여준다.
  "북마크를 정리하세요" 대신 "그 링크 어디 갔지"에서 시작한다.
- **이런 느낌 아님**: 생산성 구루, 허슬 어투, 이모지 사다리,
  "당신의 삶이 바뀝니다" 류의 과장

## 지금 있는 기능 / 아직 없는 기능

**있음** (코드 확인 완료 2026-08-05)
- 보드 단위 링크 저장·정리, 갤러리/칸반 뷰
- **공유 보드** — 보드별 Share, `/share/<token>` 공개 링크, 초대 링크 참여
  (`SharedBoardPage.tsx`, `BoardShareModal.tsx`, `api/share-preview.ts`)
- 안드로이드 공유 시트로 저장(share-to-save), iOS/Android 네이티브 앱
- 한국어/영어 UI (자동 감지)
- 메모(리치 텍스트), 카테고리·정렬·검색
- 구독 결제(Stripe 웹/Android, Apple IAP iOS)

**없음 (홍보 금지)** ← brand-qa가 이 목록으로 반려 판단
- **Chat with Board / 보드와 대화** — 코드 없음. 존재하지 않는 기능.
- **AI 요약 / AI Summary** — ⚠️ **UI에 "AI Summary" 라벨이 뜨지만 AI가 아니다.**
  `getAiSummary()`는 페이지 자체 meta description을 130자로 자르기만 한다
  (`LinkCard.tsx:242`). LLM 호출이 전혀 없다.
  → **"AI가 요약해준다"는 표현은 전부 반려.** 스토어 메타데이터에도 금지
  (앱스토어 가이드라인 2.3.1).
- **브라우저 확장** — `extension/` 디렉터리 없음. 만들지 않았다.
- **자동 태깅 / 자동 분류**

## 금칙어

- "AI가 요약해줍니다", "AI 정리", "스마트 분류" — 위 사유
- "1위", "가장 인기 있는", "N배 빠른" — 근거 없는 수치·순위
- 경쟁사(Raindrop, Pocket, mymind 등) 비방. 비교는 되지만 깎아내리기 금지.

## 타겟 키워드 (SEO)

- raindrop.io alternative
- best mobile bookmark manager
- visual bookmark app
- pocket alternative (Pocket 2025 종료 유입)
- save links from group chat

## 기존 콘텐츠

- **블로그**: `src/blog/*.md` — 10편
  (pocket-alternative, raindrop-alternative, mymind-alternative,
  saveboard-vs-raindrop, best-link-saver-apps-2026,
  stop-losing-links-group-chats, save-links-from-whatsapp,
  visual-bookmarks-better-than-url-list, sports-parent-organise-links,
  pocket-shut-down-what-to-use)
- **가이드**: `src/guides/*.{en,ko}.md` — 이중언어 필수
- ⚠️ 사이트맵은 빌드가 생성한다 (`scripts/prerender-seo.mjs`).
  `public/sitemap.xml`은 낡은 산출물이니 무시.
  로컬에 글이 있는데 라이브 사이트맵에 없으면 **배포가 안 된 것**이다.
- **인덱싱 안 된 페이지(우선 내부링크 대상)**: GSC에서 확인 후 갱신할 것.
  (2026-08-04 기준 백링크·배포가 0에 가까워 유입 저조 — 콘텐츠 문제 아님)
