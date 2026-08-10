# 사이드바 접기/펼치기 사용자 제어 — 설계

날짜: 2026-08-10

## 문제

왼쪽 사이드바 폭이 화면 폭에 의해서만 결정되고, 사용자가 바꿀 수 없다.

| 화면 폭 | 현재 동작 |
|---|---|
| ~767px | 사이드바 off-canvas, 햄버거로 드로어 |
| 768~1279px | 64px 아이콘 레일 고정. 펼침은 오버레이라 보드 선택 시 즉시 닫힘 |
| 1280px~ | 260px 항상 열림. **접을 방법 없음** |

원인:
- 폭이 Tailwind 반응형 클래스에 하드코딩 (`Sidebar.tsx` `md:w-16 xl:w-[260px]`, `App.tsx` `md:ml-16 xl:ml-[260px]`)
- 접기 버튼이 `sidebarOpen`일 때만 렌더돼서 데스크탑에서 보이지 않음
- 선택 상태가 저장되지 않음

## 상태 모델

`sidebarOpen` 하나가 *모바일 드로어*와 *태블릿 임시 확장* 두 역할을 겸하고 있어 "펼친 채 고정"이 불가능하다. 둘로 분리한다.

- **`sidebarOpen`** (기존, 유지) — 모바일(<768px) 드로어. 보드를 선택하면 닫힌다.
- **`sidebarMode`** (신규) — `'expanded' | 'rail'`. md 이상에서의 고정 폭. 보드를 선택해도 바뀌지 않는다.

지속성: `localStorage['sb_sidebar_mode']`. 기존 `lb-theme` / `lb-language`와 동일한 패턴.
계정 동기화는 하지 않는다 — 기기마다 화면 폭이 다르므로 기기별 설정이 맞다.

기본값(저장된 값이 없을 때)은 현재 보이는 모습과 동일하게 유지한다.
- `innerWidth >= 1280` → `expanded`
- 그 미만 → `rail`

한 번이라도 토글하면 그 이후로는 화면 폭과 무관하게 사용자 선택이 이긴다.

## 레이아웃

`xl:` 분기를 제거하고 `sidebarMode` 기반 inline style로 폭을 준다.

- `aside`: 모바일 드로어일 때 260px, 그 외 `expanded ? 260 : 64`
- 본문 컨테이너: 같은 값을 `marginLeft`로

Tailwind arbitrary 클래스는 동적 문자열로 만들 수 없어(purge에 잡히지 않음) inline style이 유일한 방법이다.
기존 `transition-all duration-300`을 유지해 애니메이션은 그대로 둔다.

## 토글 UI

새로 만드는 UI는 없다. 두 버튼 모두 이미 존재한다.

- 펼침 상태: 로고 행 우측 `PanelLeftClose` — 렌더 조건을 `sidebarOpen`에서 "모바일 드로어 또는 md 이상"으로 바꾼다
- 레일 상태: 로고 마크 아래 `PanelLeftOpen`

둘 다 `sidebarMode` 토글에 연결하고 `aria-label` + `aria-expanded`를 붙인다.

## 레일에서의 기능 유지

접었을 때 드래그로 보드를 정리하지 못하면 접기가 손해가 된다. 레일의 보드 점을 `RailBoardItem`으로 분리한다.

- `useDrop({ accept: LINK_DRAG_TYPE })` → `onUpdateCategory(link.id, cat)` (펼침 상태 `BoardDropItem`과 동일 동작)
- 드래그 오버 시 점 확대 + 글로우 + 배경 하이라이트
- 호버·드래그오버 시 오른쪽에 보드 이름 말풍선. CSS `group-hover`만 사용, JS 상태 추가 없음
- 브라우저 기본 `title` 툴팁은 말풍선과 중복이므로 제거

## 범위 밖 (YAGNI)

키보드 단축키, 드래그 리사이즈, 레일 폭 커스터마이즈, 계정 간 동기화.

## i18n

`collapseSidebar` / `expandSidebar` 키가 EN·KO 모두 이미 존재한다. 새 문구 없음.

## 검증

- `npm run typecheck` — 빌드 게이트이므로 0 에러 필수
- 브라우저 실측: 1440px(펼침 기본) / 1024px(레일 기본) / 390px(드로어 영향 없음)
- 각 폭에서 토글 → 새로고침 → 상태 유지 확인
- 레일 상태에서 링크 카드를 보드 점에 드롭 → 이동 확인

네이티브: 폰은 <768px라 영향 없음. 아이패드는 md 이상이라 이 동작이 적용된다.
