# 랜딩 리프레시 + 네이티브 온보딩 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **실행 결과 (2026-08-06):** Task 1·2·3 완료. **Task 4·5는 취소됐다** — 캡쳐하려고
> 실제 앱을 열어보니 뷰 기능이 모바일에서 아예 안 보이고, 갤러리는 대부분 빈 화면,
> 칸반은 썸네일이 깨져 있었다. 못 쓰는 기능을 광고할 수 없어 랜딩에서 뺐다. 사유
> 전문은 스펙의 B2 항목 참조. 그 과정에서 발견한 칸반 버그는 별도로 고쳤다
> (커밋 `5052504e`).

**Goal:** 네이티브 앱의 로그아웃 화면을 마케팅 랜딩에서 3장짜리 온보딩 → 로그인으로 바꾸고, 웹 랜딩에 빠져 있던 실제 기능(파일 업로드·멀티플랫폼·팀 초대·데스크톱 뷰 3종·6개 언어)을 반영한다.

**Architecture:** `App.tsx`의 로그아웃 분기에 플랫폼 조건을 넣어 네이티브만 새 `Onboarding` 컴포넌트로 보낸다. 웹 경로는 한 줄도 바뀌지 않는다. 랜딩 변경은 전부 `LandingPage.tsx` 한 파일 안의 이중언어 `COPY` 객체 + JSX 편집이며, 새 스크린샷 3장이 `public/app/`에 추가된다.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind, Capacitor 8, lucide-react, react-router. 새 의존성 없음 — 스와이프는 CSS `scroll-snap`으로 처리한다.

## Global Constraints

- **이 리포에는 자동 테스트가 없다** (`CLAUDE.md`: "No automated tests"). 각 태스크의 테스트 사이클은 **`npm run typecheck` (0 에러) + 명시된 수동 확인**이다. pytest/vitest 스타일 테스트를 새로 도입하지 말 것.
- `npm run build`는 `tsc --noEmit` → `vite build` → `scripts/prerender-seo.mjs` 순서다. 타입 에러 하나면 배포가 통째로 실패한다.
- 마케팅 카피는 `LandingPage.tsx` / `Auth.tsx` 패턴대로 **컴포넌트 로컬 `COPY` 객체에 en/ko 이중언어**로 넣는다. 공용 translations dict(`tr()`)는 짧은 앱 UI 라벨 전용이다.
- **없는 기능을 홍보하지 않는다.** 뷰는 3종이고 데스크톱 전용이다 (`App.tsx:985-989`, `App.tsx:1112`의 `hidden sm:flex`). `grid`/`list`는 도달 불가능한 죽은 코드이므로 카피에 등장시키지 않는다.
- 무료 한도 정확값 (`UpgradePage.tsx:24`): `{ links: 30, boards: 5, fileSizeMb: 5, storageMb: 50 }`. Pro는 300저장/30보드/20MB/2GB, Team은 10GB·보드당 25명. **초대된 멤버는 무료 참여** (`UpgradePage.tsx:399`).
- 지원 언어 6개 (`LanguageContext.tsx:17`): `en, ko, ja, zh, es, fr`.
- 스크린샷은 `public/app/`에 jpg로 넣는다. **`store/screenshots/play/*.png`는 쓰지 않는다** — 홍보 문구가 이미지에 박혀 있어 본문에서 광고처럼 보인다.
- 커밋은 `main`에 직접. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- 브랜드 그라디언트: `#A259FF` → `#FF7262` → `#F24E1E`. 새 색을 만들지 말 것.

---

### Task 1: 네이티브 온보딩 + 스토어 배지 플랫폼 가드

**Files:**
- Create: `src/app/components/Onboarding.tsx`
- Modify: `src/app/App.tsx` (import 부근, `useState` 블록 ~93행, 로그아웃 분기 1018-1021행)
- Modify: `src/app/components/LandingPage.tsx` (1행 import, 252-273행 배지 블록)

**Interfaces:**
- Produces: `Onboarding({ onDone }: { onDone: () => void })` — 기본 export 아님, 명명 export. `onDone`은 건너뛰기와 마지막 슬라이드의 "시작하기" 양쪽에서 호출된다.
- Consumes: `public/app/app-saves.jpg`, `app-boards.jpg`, `app-boards-move.jpg` (이미 존재, 새로 만들지 않음)
- localStorage 키: `sb_onboarded`, 값 `'1'`

- [ ] **Step 1: `Onboarding.tsx` 생성**

```tsx
import { useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onDone: () => void;
}

// Native-only first-run intro. Web visitors get LandingPage instead: someone who
// already installed the app does not need to be sold the app, and the landing's
// Google Play badge has no business rendering inside the iOS build.
const COPY = {
  en: {
    skip: 'Skip',
    next: 'Next',
    start: 'Get started',
    slides: [
      { title: 'Just paste the link', desc: 'The title, image and description are fetched for you.' },
      { title: 'A board per activity', desc: 'Basketball, travel, recipes — each one kept separate.' },
      { title: 'Find it in seconds', desc: 'Search it, move it, share it — whenever you need it.' },
    ],
  },
  ko: {
    skip: '건너뛰기',
    next: '다음',
    start: '시작하기',
    slides: [
      { title: '링크를 붙여넣기만 하세요', desc: '제목·이미지·설명은 자동으로 가져와요.' },
      { title: '활동별로 보드를 나눠서', desc: '농구, 여행, 레시피 따로따로.' },
      { title: '필요할 때 몇 초 만에', desc: '검색하고, 옮기고, 공유하고.' },
    ],
  },
} as const;

const SHOTS = [
  '/app/app-saves.jpg',
  '/app/app-boards.jpg',
  '/app/app-boards-move.jpg',
];

export function Onboarding({ onDone }: Props) {
  const { language } = useLanguage();
  const c = COPY[language as keyof typeof COPY] ?? COPY.en;
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
  };

  // scroll-snap drives the swipe; the button drives the scroll. Reading the index
  // back off scrollLeft keeps the dots honest for both without a carousel library.
  const onScroll = () => {
    const el = trackRef.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const last = index === SHOTS.length - 1;

  return (
    <div
      className="min-h-screen bg-white flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="h-12 px-5 flex items-center justify-end">
        <button onClick={onDone} className="text-[14px] font-medium text-gray-400 active:opacity-60">
          {c.skip}
        </button>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        style={{ scrollbarWidth: 'none' }}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
      >
        {SHOTS.map((src, i) => (
          <div key={src} className="w-full shrink-0 snap-center flex flex-col items-center justify-center px-8 gap-7">
            <img
              src={src}
              alt={c.slides[i].title}
              width={430}
              height={935}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="w-[200px] max-w-[55vw] rounded-[22px] border border-gray-200 shadow-xl shadow-gray-200"
            />
            <div className="text-center">
              <p className="text-[22px] font-bold text-gray-900 mb-2">{c.slides[i].title}</p>
              <p className="text-[15px] text-gray-500 leading-relaxed">{c.slides[i].desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-8 pb-8 pt-4 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {SHOTS.map((_, i) => (
            <span
              key={i}
              className="h-2 rounded-full transition-all"
              style={{ width: i === index ? 20 : 8, background: i === index ? '#A259FF' : '#E5E7EB' }}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? onDone() : goTo(index + 1))}
          className="w-full max-w-[320px] py-3.5 rounded-2xl bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white font-semibold text-[16px] active:scale-95 transition-transform"
        >
          {last ? c.start : c.next}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `App.tsx`에 import 추가**

13행 `import { LandingPage } ...` 바로 아래에:

```tsx
import { Onboarding } from './components/Onboarding';
```

- [ ] **Step 3: `App.tsx`에 온보딩 상태 추가**

93행 `const [showAuth, setShowAuth] = ...` 바로 아래에:

```tsx
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('sb_onboarded') === '1');
```

- [ ] **Step 4: 로그아웃 분기 교체**

`App.tsx:1018-1021`의

```tsx
  if (!user) {
    if (showAuth) return <Auth />;
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }
```

를 다음으로 교체:

```tsx
  if (!user) {
    // Native users already installed the app — the landing page is a pitch to
    // install it. Show the first-run intro once, then go straight to sign-in.
    // Deep links (/share/:token, /team/:token, /reset-password, /guides/*) are
    // separate routes in main.tsx and never reach this branch.
    if (Capacitor.isNativePlatform()) {
      if (!onboarded) {
        return <Onboarding onDone={() => { localStorage.setItem('sb_onboarded', '1'); setOnboarded(true); }} />;
      }
      return <Auth />;
    }
    if (showAuth) return <Auth />;
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }
```

- [ ] **Step 5: `LandingPage.tsx`에 플랫폼 가드 추가**

3행 `import { useLanguage } ...` 아래에 추가:

```tsx
import { Capacitor } from '@capacitor/core';
```

171행 `const c = COPY[...] ?? COPY.en;` 아래에 추가:

```tsx
  // Onboarding means native never reaches this page — but if a future route ever
  // lands here, an iOS build must not render a Google Play badge.
  const isNative = Capacitor.isNativePlatform();
```

252행 `{/* App store download badges */}`부터 273행 `</div>`까지의 배지 블록 전체를 `{!isNative && ( ... )}`로 감싼다. 감싸는 대상은 `<div className="flex gap-3 flex-wrap -mt-6 mb-10">` 요소 하나다.

- [ ] **Step 6: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0. `Onboarding` 미정의(TS2304)나 `onDone` 시그니처 불일치가 나오면 Step 1-4를 다시 볼 것.

- [ ] **Step 7: 웹 회귀 확인 — 아무것도 안 바뀌었는지**

Run: `npm run dev`
브라우저 시크릿 창에서 `http://localhost:5173` 열기.
Expected:
- 랜딩이 예전과 똑같이 뜬다 (온보딩 아님)
- App Store / Google Play 배지 **둘 다 보인다** (웹이므로)
- "무료로 시작하기" → 로그인 폼

- [ ] **Step 8: 네이티브 확인 — 4가지 시나리오**

```bash
npm run build && npx cap sync ios
cd ios/App && xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
```
시뮬레이터에 설치 후 확인:
1. 첫 실행 → 온보딩 3장이 뜨고 랜딩은 안 뜬다. 스와이프와 "다음" 버튼 둘 다 도트를 움직인다
2. 마지막 슬라이드 버튼이 "시작하기" → 누르면 로그인 화면
3. 앱 종료 후 재실행 → 온보딩 없이 바로 로그인
4. 건너뛰기로도 같은 결과 (재실행 시 안 뜸)

localStorage를 지우고 1번을 다시 보려면 시뮬레이터에서 앱 삭제 후 재설치.

- [ ] **Step 9: 딥링크가 가로채이지 않는지 확인**

시뮬레이터에서 (로그아웃 상태, 온보딩 미열람 상태로):
```bash
xcrun simctl openurl booted "app.saveboard.saveboard://share/<실제_토큰>"
```
Expected: 온보딩이 아니라 공유 보드 페이지가 뜬다.

- [ ] **Step 10: 커밋**

```bash
git add src/app/components/Onboarding.tsx src/app/App.tsx src/app/components/LandingPage.tsx
git commit -m "$(cat <<'EOF'
Native: a first-run intro instead of the landing page

The logged-out branch didn't check the platform, so someone who had already
installed the app opened it to a page telling them to install the app — and the
iOS build rendered a Google Play badge while doing it. Native now gets three
slides built from the screenshots already in public/app, then the sign-in form;
the flag is remembered so signing out later goes straight to sign-in.

Web takes the same path it always did. The landing keeps a platform guard on the
store badges anyway, in case some future route lands there natively.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 솔루션 그리드 중복 제거 + 푸터 언어 줄

**Files:**
- Modify: `src/app/components/LandingPage.tsx` (1행 import, `COPY.en.solutions` 50-57행, `COPY.ko.solutions` 127-134행, `solutionMeta` 173-180행, 푸터 554-572행)

**Interfaces:**
- Consumes: Task 1의 `isNative` 변수는 여기서 쓰지 않는다. 독립적으로 적용 가능.
- Produces: 없음 (이후 태스크가 의존하지 않는다)

- [ ] **Step 1: lucide 아이콘 import 교체**

1행에서 `Play`와 `Search`를 빼고 `Paperclip`, `Smartphone`을 넣는다. (둘 다 `solutionMeta`에서만 쓰이므로 다른 참조는 없다.)

```tsx
import { Bookmark, Link2, FileText, Paperclip, StickyNote, Sparkles, Share2, ArrowRight, Check, Smartphone, Shield } from 'lucide-react';
```

- [ ] **Step 2: `COPY.en.solutions` 3번째·5번째 항목 교체**

50-57행. 3번째 `'Find in seconds'`(AI 검색 섹션과 중복)와 5번째 `'Save in seconds'`(사용방법 1단계와 중복)를 바꾼다:

```tsx
    solutions: [
      { label: 'Beautiful visual cards',   desc: 'Every link becomes a rich preview with image, title, and description.' },
      { label: 'Organise by activity',     desc: 'Create boards for Basketball, Gymnastics, Tennis — each activity tidy and separate.' },
      { label: 'Files, not just links',    desc: 'Attach the PDF itself — the registration form sits right next to the schedule link.' },
      { label: 'Add notes & reminders',    desc: 'Add context like "Register by June 1st" so you never forget the details.' },
      { label: 'Web, iPhone and Android',  desc: 'Save it on your phone, find it on your laptop. The same boards on every device.' },
      { label: 'Private & just yours',     desc: 'Your links are private. No one sees your board unless you choose to share.' },
    ],
```

- [ ] **Step 3: `COPY.ko.solutions` 동일 위치 교체**

127-134행:

```tsx
    solutions: [
      { label: '예쁜 비주얼 카드',        desc: '모든 링크가 이미지·제목·설명이 담긴 미리보기로 바뀌어요.' },
      { label: '활동별로 정리',          desc: '농구, 체조, 테니스 — 활동마다 보드를 만들어 깔끔하게 분리해요.' },
      { label: '링크만이 아니라 파일도',  desc: 'PDF를 그대로 첨부하세요. 신청서가 일정 링크 바로 옆에 놓여요.' },
      { label: '메모 & 알림 추가',       desc: '"6월 1일까지 신청" 같은 메모를 달아 놓치지 않게 하세요.' },
      { label: '웹·아이폰·안드로이드',    desc: '폰에서 저장하고 노트북에서 찾으세요. 모든 기기에 같은 보드.' },
      { label: '오직 나만의 공간',       desc: '내 링크는 비공개예요. 공유하기 전엔 아무도 내 보드를 못 봐요.' },
    ],
```

- [ ] **Step 4: `solutionMeta` 아이콘 교체**

173-180행. 색상은 그대로 두고 3번째·5번째 아이콘만 바꾼다:

```tsx
  const solutionMeta = [
    { icon: Link2,      bg: '#EDE9FE', color: '#7C3AED' },
    { icon: FileText,   bg: '#CCFBF1', color: '#0D9488' },
    { icon: Paperclip,  bg: '#FEF9C3', color: '#CA8A04' },
    { icon: StickyNote, bg: '#FFE4E6', color: '#E11D48' },
    { icon: Smartphone, bg: '#DBEAFE', color: '#2563EB' },
    { icon: Shield,     bg: '#DCFCE7', color: '#16A34A' },
  ];
```

- [ ] **Step 5: 지원 언어 상수 추가**

`COPY` 객체가 끝나는 167행 `} as const;` 바로 아래에:

```tsx
// Six languages ship in LanguageContext but the landing never said so.
// Written in each language's own name, so it reads regardless of the visitor's.
const LANGS = 'English · 한국어 · 日本語 · 中文 · Español · Français';
```

- [ ] **Step 6: 푸터에 언어 줄 추가**

푸터(554-572행) 안쪽 `<div className="max-w-5xl mx-auto flex flex-col sm:flex-row ...">`를 감싸는 구조를 바꾸지 말고, 그 div **바로 아래**(닫는 `</div>` 다음, `</footer>` 앞)에 추가:

```tsx
          <p className="max-w-5xl mx-auto mt-4 text-center sm:text-left text-[12px] text-gray-400">
            {LANGS}
          </p>
```

- [ ] **Step 7: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0. `Play`/`Search`를 지웠는데 다른 곳에서 쓰고 있었다면 TS2304가 뜬다 — 그 경우 해당 import만 되살린다.

- [ ] **Step 8: 눈으로 확인**

Run: `npm run dev` → 랜딩 스크롤
Expected:
- 솔루션 6칸에 "링크만이 아니라 파일도"(클립 아이콘)와 "웹·아이폰·안드로이드"(폰 아이콘)가 보인다
- "몇 초 만에 찾기"/"몇 초 만에 저장"은 사라졌다
- 푸터 맨 아래 언어 6개 줄
- 언어를 한국어/English로 바꿔가며 두 카피 모두 확인

- [ ] **Step 9: 커밋**

```bash
git add src/app/components/LandingPage.tsx
git commit -m "$(cat <<'EOF'
Landing: swap two repeated tiles for what the app actually gained

Two of the six solution tiles said what other sections already said — "find in
seconds" is the AI search section, "save in seconds" is step one of How it
works. They now carry file attachments and cross-device sync, neither of which
appeared anywhere on the page despite both shipping months ago.

The footer also now says the app speaks six languages, which it has never said.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 공유 섹션 → 팀 초대까지 확장

**Files:**
- Modify: `src/app/components/LandingPage.tsx` (`COPY.en` 77-82행 share 블록, `COPY.ko` 154-159행, 공유 섹션 JSX 487-514행)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

**배경 (카피 정확성 근거 — 없는 기능을 쓰지 않기 위해 확인된 사실):**
`BoardShareModal.tsx`에 "Invite people" / "Public link" 두 탭이 있다. Invite 탭은 이메일 초대(`sendBoardInviteEmail`), 초대 링크 복사(`inviteUrl`), 멤버 목록/제거(`loadBoardMembers`/`removeMember`)를 지원한다. 한도는 무료 팀 보드 1개, Pro 5개(각 10명), Team 25개(각 25명)이며 **초대된 멤버는 무료로 참여**한다(`UpgradePage.tsx:399`). 공개 링크는 계정 없이 열람 가능하다.

- [ ] **Step 1: `COPY.en` share 블록 교체**

77-82행:

```tsx
    shareBadge: 'Sharing',
    shareTitle: 'Share with the whole team',
    shareDesc: 'Send other parents a link to your Basketball or Gymnastics board — or invite them in so everyone saves to the same place.',
    sharePoints: [
      'Invite people to save into the same board',
      'Invited members join free — they need no plan of their own',
      'Or send a public link that opens without an account',
    ],
    shareBoardLabel: 'Shared board',
    shareBoardName: 'My Korea Trip 🇰🇷',
    copyLink: 'Copy link',
```

- [ ] **Step 2: `COPY.ko` share 블록 교체**

154-159행:

```tsx
    shareBadge: '공유',
    shareTitle: '팀 전체와 공유',
    shareDesc: '농구나 체조 보드를 다른 학부모에게 링크로 보내세요 — 아예 초대해서 다 같이 한 곳에 저장할 수도 있어요.',
    sharePoints: [
      '같은 보드에 함께 저장하도록 초대하기',
      '초대된 멤버는 무료로 참여해요 — 각자 요금제가 없어도 돼요',
      '공개 링크를 보내면 계정 없이도 열려요',
    ],
    shareBoardLabel: '공유된 보드',
    shareBoardName: '나의 한국 여행 🇰🇷',
    copyLink: '링크 복사',
```

- [ ] **Step 3: 공유 섹션 JSX에 체크 목록 추가**

`{c.shareDesc}`를 담은 `<p>`(495-497행) 바로 아래에, AI 섹션(462-469행)과 같은 패턴으로 추가:

```tsx
            <div className="mt-5">
              {c.sharePoints.map(item => (
                <div key={item} className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-orange-500" />
                  </div>
                  <span className="text-[13px] text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
```

(AI 섹션은 보라색 배지라 `bg-purple-100`/`text-purple-600`을 쓴다. 공유 섹션 배지는 주황이므로 주황으로 맞춘다.)

- [ ] **Step 4: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0. `COPY`가 `as const`이므로 en/ko 양쪽에 `sharePoints`가 다 없으면 여기서 잡힌다.

- [ ] **Step 5: 눈으로 확인 + 사실 확인**

Run: `npm run dev` → 공유 섹션
Expected:
- 체크 3줄이 주황 체크 아이콘으로 뜬다
- en/ko 둘 다 뜬다
- **주장 대조**: 로그인한 상태에서 보드 하나의 공유 모달을 열어 "Invite people" 탭에 이메일 초대와 멤버 목록이 실제로 있는지, "Public link" 탭이 계정 없이 열리는 링크를 주는지 눈으로 확인한다. 카피가 앞서가면 안 된다.

- [ ] **Step 6: 커밋**

```bash
git add src/app/components/LandingPage.tsx
git commit -m "$(cat <<'EOF'
Landing: the sharing section only knew about half of sharing

It described sending someone a read-only link and stopped there, while the app
has had an Invite tab — email invites, member list, shared editing — for months.
It also never mentioned that invited members join without a plan of their own,
which is the part that makes a team board worth starting.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 데스크톱 뷰 스크린샷 3장 캡쳐

**Files:**
- Create: `public/app/view-cards.jpg`, `public/app/view-gallery.jpg`, `public/app/view-kanban.jpg`

**Interfaces:**
- Produces: 위 3개 경로. Task 5가 정확히 이 파일명으로 참조한다.

**계정:** 가이드 봇 계정 (`~/guides-bot-credentials.txt`, mode 600). 자격증명을 리포나 커밋 메시지, 대화 로그에 절대 붙여넣지 말 것.

**보드 선별 주의:** 봇 계정 보드 중 랜딩 페르소나(학부모·코치·모임 리더)에 맞는 것은 **농구 앱 / 멜버른 라멘 / 퍼스 한국 BBQ** 셋이다. **과다월경 자료 보드는 PeriodVol 마케팅 자산**이라 SaveBoard 랜딩의 사이드바에 찍히면 톤이 어긋난다.

- [ ] **Step 1: 페르소나 보드 채우기**

봇 계정으로 로그인해 랜딩 카피와 맞는 보드를 만들고 링크를 채운다: `농구팀 🏀`, `가족 여행 ✈️`, `레시피 🍳`. 각 보드에 **최소 6개** 링크 — 카드가 적으면 칸반·갤러리 스크린샷이 초라해진다. 이미지 미리보기가 잡히는 URL을 고를 것 (빈 썸네일 카드가 섞이면 그리드가 지저분해진다).

- [ ] **Step 2: 캡쳐 환경 맞추기**

- 브라우저 창 **1440×900**
- 라이트 테마 (랜딩 전체가 라이트다)
- **보드 하나를 연 상태.** 홈 대시보드(`selected === 'all'`)에서는 뷰 토글이 숨겨진다 (`App.tsx:1112`)
- 사이드바에 과다월경 보드 이름이 보이지 않는 스크롤 위치

- [ ] **Step 3: 세 장 캡쳐**

툴바 우측 뷰 토글(아이콘 3개)로 전환하며 한 장씩:
1. 왼쪽 `Columns2` 아이콘 = masonry → `view-cards.jpg`
2. 가운데 `GalleryIcon` = gallery → `view-gallery.jpg`
3. 오른쪽 `Kanban` 아이콘 = kanban → `view-kanban.jpg`

- [ ] **Step 4: 저장 + 용량 확인**

`public/app/`에 jpg로 저장. 기존 3장과 자릿수가 비슷해야 한다:

Run: `ls -lh public/app/`
Expected: 새 3장이 기존 `app-*.jpg`와 비슷한 크기 (수백 KB 수준). 1MB를 크게 넘으면 품질을 낮춰 다시 저장한다 — 랜딩 로딩 속도에 그대로 들어간다.

- [ ] **Step 5: 커밋**

```bash
git add public/app/view-cards.jpg public/app/view-gallery.jpg public/app/view-kanban.jpg
git commit -m "$(cat <<'EOF'
Landing: desktop screenshots of the three board views

Real screens from a board with enough saves in it to show what each layout is
for. Captured at 1440x900 because the view toggle only renders at sm: and up —
there is no phone shot of these to take.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 뷰 3종 섹션 신설

**Files:**
- Modify: `src/app/components/LandingPage.tsx` (`COPY.en`/`COPY.ko`에 views 블록 추가, 스크린샷 섹션 401행 `</section>` 뒤에 새 섹션)

**Interfaces:**
- Consumes: Task 4의 `public/app/view-cards.jpg`, `view-gallery.jpg`, `view-kanban.jpg`
- Produces: 없음

- [ ] **Step 1: `COPY.en`에 views 블록 추가**

`shots: [...]` 배열이 끝나는 64행 다음, `howTitle` 앞에:

```tsx
    viewsTitle: 'On a bigger screen, your way',
    viewsSub: 'Open a board on a laptop and switch how it lays out — one click apart.',
    views: [
      { tab: 'Cards',   desc: 'Every save as a card, packed tight whatever its height. This is the default.' },
      { tab: 'Gallery', desc: 'One big image at a time, for boards that are mostly pictures.' },
      { tab: 'Kanban',  desc: 'A column per board, and you drag a save from one to another.' },
    ],
```

- [ ] **Step 2: `COPY.ko`에 views 블록 추가**

`shots: [...]`가 끝나는 141행 다음, `howTitle` 앞에:

```tsx
    viewsTitle: '큰 화면에서는 원하는 방식으로',
    viewsSub: '노트북에서 보드를 열면 배치를 바꿀 수 있어요 — 클릭 한 번이면 돼요.',
    views: [
      { tab: '카드',   desc: '저장한 것들이 높이 상관없이 촘촘한 카드로. 기본 보기예요.' },
      { tab: '갤러리', desc: '이미지를 크게 한 장씩 — 사진 위주 보드에 좋아요.' },
      { tab: '칸반',   desc: '보드마다 열 하나씩, 저장한 걸 끌어서 옮겨요.' },
    ],
```

- [ ] **Step 3: 탭 상태 추가**

`const isNative = Capacitor.isNativePlatform();` 아래(Task 1에서 추가한 줄):

```tsx
  const [viewTab, setViewTab] = useState(0);
```

1행 React import가 없으므로 파일 맨 위에 추가:

```tsx
import { useState } from 'react';
```

- [ ] **Step 4: 새 섹션 삽입**

스크린샷 섹션이 끝나는 401행 `</section>` **바로 다음**, 솔루션 섹션(403행 주석) **앞**에:

```tsx
      {/* Desktop view modes — the toggle is hidden below sm:, so the copy says so */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">{c.viewsTitle}</h2>
          <p className="text-gray-500 text-center mb-8 text-[16px]">{c.viewsSub}</p>

          <div className="flex justify-center gap-2 mb-8">
            {c.views.map(({ tab }, i) => (
              <button
                key={tab}
                onClick={() => setViewTab(i)}
                className="px-4 py-2 rounded-xl text-[14px] font-medium transition-all border"
                style={
                  viewTab === i
                    ? { background: '#F5F3FF', borderColor: '#A259FF', color: '#7C3AED' }
                    : { background: 'white', borderColor: '#E5E7EB', color: '#6B7280' }
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <figure className="flex flex-col items-center gap-4">
            {['/app/view-cards.jpg', '/app/view-gallery.jpg', '/app/view-kanban.jpg'].map((src, i) => (
              <img
                key={src}
                src={src}
                alt={c.views[i].desc}
                width={1440}
                height={900}
                loading={i === 0 ? 'eager' : 'lazy'}
                className={`w-full max-w-[860px] rounded-2xl border border-gray-200 shadow-xl shadow-gray-200 ${viewTab === i ? '' : 'hidden'}`}
              />
            ))}
            <figcaption className="text-[14px] text-gray-500 text-center max-w-[520px]">
              {c.views[viewTab].desc}
            </figcaption>
          </figure>
        </div>
      </section>
```

세 장 모두 DOM에 두고 `hidden`으로 감추는 이유: 탭을 눌렀을 때 이미지가 새로 로드되며 깜빡이지 않는다. 첫 장만 eager라 초기 로딩 비용은 한 장이다.

- [ ] **Step 5: 타입체크**

Run: `npm run typecheck`
Expected: 에러 0.

- [ ] **Step 6: 눈으로 확인**

Run: `npm run dev`
Expected:
- 스크린샷(폰 3장) 섹션 바로 아래에 새 섹션
- 탭 3개를 눌러가며 이미지와 캡션이 같이 바뀐다
- 이미지 전환 시 깜빡임 없음
- 모바일 폭(개발자도구 375px)에서 이미지가 넘치지 않는다
- en/ko 둘 다 확인. **한국어 카피에 "큰 화면"/"노트북"이 들어 있어야 한다** — 폰에서 찾다가 못 찾는 일을 막는 문구다

- [ ] **Step 7: 커밋**

```bash
git add src/app/components/LandingPage.tsx
git commit -m "$(cat <<'EOF'
Landing: show the three board views

Cards, gallery and kanban have been in the app for a long time and the landing
page never showed any of them. The copy says "on a bigger screen" because that
is the truth — the toggle renders at sm: and up only, and most visitors arrive
on a phone.

Three views, not five: the ViewMode type has grid and list too, but nothing
renders a button for them, so nobody can reach them and the page doesn't claim
they exist.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: 전체 검증 + 배포

**Files:** 없음 (검증만)

- [ ] **Step 1: 빌드 게이트**

Run: `npm run build`
Expected: 통과. `tsc --noEmit` → `vite build` → `prerender-seo.mjs` 셋 다. 사이트맵과 프리렌더 HTML이 정상 생성되는지 출력 확인.

- [ ] **Step 2: 프로덕션 번들로 랜딩 확인**

Run: `npx vite preview`
Expected: 랜딩 전체 스크롤 — 새 섹션 1개, 바뀐 타일 2개, 공유 체크 3줄, 푸터 언어 줄. 콘솔 에러 0. 이미지 404 0.

- [ ] **Step 3: 네이티브 최종 확인**

```bash
npx cap sync ios
```
시뮬레이터 재설치 후 Task 1 Step 8의 4가지 시나리오를 다시 한 번. 랜딩에 도달하는 경로가 없는지, 있더라도 스토어 배지가 없는지 확인.

- [ ] **Step 4: 푸시**

```bash
git push origin main
```

⚠️ 커밋 이메일이 GitHub 계정에 연결돼 있어야 Vercel이 배포한다 — 아니면 push는 성공하는데 프로덕션이 조용히 그대로 있는다.

- [ ] **Step 5: 배포 확인**

배포 완료 후 `https://www.saveboard.app`(www 정규 호스트)에서 로그아웃 상태로 랜딩을 열어 새 섹션 4가지가 다 보이는지 확인한다. 로컬만 보고 완료라고 하지 말 것.

- [ ] **Step 6: 안 한 것 보고**

이 계획은 **웹 배포까지**다. 네이티브 온보딩은 코드에 들어갔지만 **스토어 릴리스는 별건**이다. 릴리스하려면 버전 범프 + `CHANGELOG.md` + `store/release-notes.md`(EN/KO) + 스토어 제출이 필요하고, 이건 이 계획의 범위 밖이다. 완료 보고에 이 사실을 명시할 것.

---

## Self-Review

**1. Spec coverage**

| 스펙 항목 | 태스크 |
|---|---|
| A. 온보딩 분기 + 슬라이드 3장 + scroll-snap + 딥링크 안전 | Task 1 (Step 1-4, 9) |
| A. 스토어 배지 플랫폼 가드 | Task 1 (Step 5) |
| B1. 솔루션 그리드 중복 2칸 교체 | Task 2 (Step 2-4) |
| B2. 뷰 3종 섹션 (데스크톱 명시) | Task 5 |
| B3. 공유 → 팀 초대 + 멤버 무료 | Task 3 |
| B4. 푸터 언어 6개 | Task 2 (Step 5-6) |
| B5. 배지 가드 | Task 1과 동일 |
| 스크린샷 (봇 계정, 보드 선별, 데스크톱 3컷) | Task 4 |
| 검증 (typecheck/build/웹/시뮬레이터 4종/딥링크) | Task 1 Step 6-9, Task 6 |
| 범위 밖 (전면 재설계·가이드 섹션·스토어 제출) | Task 6 Step 6에 명시 |

누락 없음.

**2. Placeholder scan**

"TBD"/"적절히 처리"/"위와 유사" 없음. 모든 코드 스텝에 실제 코드가 들어 있다. 테스트가 없는 리포이므로 테스트 코드 대신 타입체크 + 구체적 수동 확인 항목으로 대체했고, 이는 Global Constraints에 명시했다.

**3. Type consistency**

- `Onboarding({ onDone })` — Task 1 Step 1 정의, Step 4 사용. 일치.
- localStorage 키 `sb_onboarded` / 값 `'1'` — Step 3(읽기)과 Step 4(쓰기) 일치.
- `isNative` — Task 1 Step 5에서 선언, Task 5 Step 3이 그 아래에 `viewTab`을 추가하므로 Task 1이 먼저 끝나야 한다. Task 5는 Task 1 의존.
- 이미지 경로 `view-cards.jpg`/`view-gallery.jpg`/`view-kanban.jpg` — Task 4 생성, Task 5 참조. 일치.
- `c.views[i].tab` / `.desc`, `c.sharePoints` — 정의와 사용 일치.
- `Paperclip`/`Smartphone` — Task 2 Step 1 import, Step 4 사용. 일치.

**태스크 순서 의존성:** Task 1 → (2, 3 독립) → 4 → 5 → 6. Task 5는 Task 1(`isNative` 줄 위치)과 Task 4(이미지)에 의존한다.
