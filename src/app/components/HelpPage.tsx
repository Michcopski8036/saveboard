import { useState } from 'react';
import { X, Search, ChevronDown, ChevronRight, Link2, Tag, Layout, Star, Download, Trash2, Columns2, Mail } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FAQ {
  q: string;
  a: string;
}

interface Guide {
  title: string;
  steps: string[];
}

interface Section {
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  faqs: FAQ[];
  guide?: Guide;
}

const SECTIONS: Section[] = [
  {
    icon: Link2,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.10)',
    title: 'Adding Links',
    guide: {
      title: 'How to add your first link',
      steps: [
        'Paste a URL into the bar at the top of the screen.',
        'Press Enter or tap the Save button.',
        'SaveBoard fetches the title, description, and preview image automatically.',
        'You can also type a plain note (no URL needed) — it saves as a memo card.',
        'To upload a PDF or image file, tap the paperclip icon next to the input bar.',
      ],
    },
    faqs: [
      { q: 'Can I save YouTube videos or tweets?', a: 'Yes — paste any URL and SaveBoard will fetch a preview. Embed codes (YouTube <iframe>, Twitter widget) are also supported.' },
      { q: 'What happens if the link has no preview image?', a: 'SaveBoard shows a styled placeholder. You can always edit the title and description manually.' },
      { q: 'Can I add a note without a link?', a: 'Yes. Just type any text in the input bar (no https://) and it saves as a memo card.' },
    ],
  },
  {
    icon: Layout,
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.10)',
    title: 'Boards & Collections',
    guide: {
      title: 'Organising links into boards',
      steps: [
        'In the sidebar, click the + button next to BOARDS to create a new board.',
        'Give it a name like "Design Inspiration" or "Reading List".',
        'Open any link card and use the board picker to move it to a board.',
        'To rename or delete a board, hover over it in the sidebar and click ···',
        'Use the Kanban view to see all your boards as columns side by side.',
      ],
    },
    faqs: [
      { q: 'What is the difference between Collections and Boards?', a: 'Collections (Home, Recently Saved, Favorites, Unsorted) are automatic smart filters. Boards are custom categories you create yourself.' },
      { q: 'How many boards can I create?', a: 'Free plan: up to 5 boards. Pro plan: unlimited boards.' },
      { q: 'Can I share a board?', a: 'Yes — hover over a board in the sidebar, click ··· and choose Share to get a public read-only link.' },
    ],
  },
  {
    icon: Tag,
    color: '#059669',
    bg: 'rgba(5,150,105,0.10)',
    title: 'Tags',
    guide: {
      title: 'Using tags to find things fast',
      steps: [
        'SaveBoard auto-generates tags from your links (e.g. #video, #github, #design).',
        'Tags appear in the sidebar — click one to filter all matching links instantly.',
        'To add your own tag: open a link card, tap Edit, and type in the Tags field.',
        'Press Enter after each tag to add it. Backspace removes the last tag.',
        'As you type, existing tags appear as suggestions — tap one to apply it.',
      ],
    },
    faqs: [
      { q: 'Where do the auto-tags come from?', a: 'SaveBoard analyses the link\'s URL, title, and description to suggest relevant tags like #video, #ai, #tutorial, #social, and more.' },
      { q: 'Can I remove an auto-generated tag?', a: 'Auto-tags are derived on the fly and cannot be deleted, but you can filter them out by selecting a different collection.' },
      { q: 'Are tags case-sensitive?', a: 'No — "AI", "ai", and "Ai" all map to the same #ai tag.' },
    ],
  },
  {
    icon: Star,
    color: '#D97706',
    bg: 'rgba(217,119,6,0.10)',
    title: 'Favorites & Search',
    faqs: [
      { q: 'How do I favorite a link?', a: 'Tap the star icon on any link card. Favorited links appear in the Favorites collection in the sidebar.' },
      { q: 'How do I search?', a: 'Click the search icon in the header (or tap Search in the bottom nav on mobile). Type any keyword — results update instantly across titles, descriptions, and URLs.' },
      { q: 'Can I search inside a specific board?', a: 'Select the board first, then use the search bar — results are scoped to the current view.' },
      { q: 'What is the Unsorted collection?', a: 'It shows all links that have not been assigned to a board yet, so you can quickly tidy them up.' },
    ],
  },
  {
    icon: Columns2,
    color: '#DB2777',
    bg: 'rgba(219,39,119,0.10)',
    title: 'Views & Layout',
    faqs: [
      { q: 'What view modes are available?', a: 'Masonry (Pinterest-style), Grid (fixed tiles), List (compact rows), and Kanban (board columns). Switch using the icons in the top-right of the header.' },
      { q: 'How do I sort my links?', a: 'Use the sort dropdown (top-right of the content area) to switch between Newest, Oldest, A–Z, and Z–A.' },
      { q: 'How do I delete multiple links at once?', a: 'Click Select in the header, tap each link you want to remove, then press Delete. A confirmation bar appears at the bottom.' },
      { q: 'Can I change the app theme?', a: 'Yes — click your avatar → Theme, then choose Light, Dark, or System.' },
    ],
  },
  {
    icon: Download,
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,0.10)',
    title: 'Export & Import',
    faqs: [
      { q: 'How do I export my links?', a: 'Go to Settings → Export links. A JSON file containing all your links and boards is downloaded to your device.' },
      { q: 'How do I import links?', a: 'Settings → Import links, then select a previously exported SaveBoard JSON file. Note: Import replaces your current data.' },
      { q: 'Is import available on the free plan?', a: 'Import is a Pro feature. Export is available on all plans.' },
    ],
  },
  {
    icon: Trash2,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.10)',
    title: 'Account & Data',
    faqs: [
      { q: 'How do I change my language?', a: 'Click your avatar → Language, then select from the list. The entire interface updates instantly.' },
      { q: 'Is my data safe?', a: 'All data is stored securely in Supabase (PostgreSQL). Your links are private to your account.' },
      { q: 'How do I sign out?', a: 'Click your avatar at the top right, then tap Log out at the bottom of the menu.' },
      { q: 'What is the free plan limit?', a: 'Free plan includes up to 30 links and 5 boards. Upgrade to Pro for unlimited links, boards, and import.' },
    ],
  },
];

// Korean content for each section, keyed by the English section title (which
// stays the stable identity used for open/close state). Only the DISPLAY text
// is swapped — identity keys never change.
type SectionText = { title: string; guide?: Guide; faqs: FAQ[] };
const SECTION_KO: Record<string, SectionText> = {
  'Adding Links': {
    title: '링크 추가',
    guide: {
      title: '첫 링크 추가하는 법',
      steps: [
        '화면 상단의 입력창에 URL을 붙여넣으세요.',
        'Enter를 누르거나 저장 버튼을 탭하세요.',
        'SaveBoard가 제목·설명·미리보기 이미지를 자동으로 가져와요.',
        'URL 없이 그냥 메모를 입력해도 돼요 — 메모 카드로 저장돼요.',
        'PDF나 이미지 파일을 올리려면 입력창 옆 클립 아이콘을 탭하세요.',
      ],
    },
    faqs: [
      { q: 'YouTube 영상이나 트윗도 저장할 수 있나요?', a: '네 — 어떤 URL이든 붙여넣으면 미리보기를 가져와요. 임베드 코드(YouTube <iframe>, 트위터 위젯)도 지원해요.' },
      { q: '링크에 미리보기 이미지가 없으면요?', a: '스타일이 적용된 플레이스홀더가 표시돼요. 제목과 설명은 언제든 직접 수정할 수 있어요.' },
      { q: '링크 없이 메모만 추가할 수 있나요?', a: '네. 입력창에 (https:// 없이) 아무 텍스트나 입력하면 메모 카드로 저장돼요.' },
    ],
  },
  'Boards & Collections': {
    title: '보드 & 컬렉션',
    guide: {
      title: '링크를 보드로 정리하기',
      steps: [
        '사이드바에서 보드 옆의 + 버튼을 눌러 새 보드를 만드세요.',
        '"디자인 영감"이나 "읽을 거리" 같은 이름을 붙이세요.',
        '링크 카드를 열고 보드 선택기로 원하는 보드로 옮기세요.',
        '보드 이름 변경/삭제는 사이드바에서 보드에 마우스를 올리고 ···를 누르세요.',
        '칸반 보기로 모든 보드를 나란히 열(column)로 볼 수 있어요.',
      ],
    },
    faqs: [
      { q: '컬렉션과 보드의 차이가 뭔가요?', a: '컬렉션(홈, 최근 저장, 즐겨찾기, 미분류)은 자동 스마트 필터예요. 보드는 직접 만드는 커스텀 카테고리예요.' },
      { q: '보드를 몇 개까지 만들 수 있나요?', a: '무료 플랜: 최대 5개. Pro 플랜: 무제한.' },
      { q: '보드를 공유할 수 있나요?', a: '네 — 사이드바에서 보드에 마우스를 올리고 ···를 눌러 공유를 선택하면 읽기 전용 공개 링크가 생겨요.' },
    ],
  },
  'Tags': {
    title: '태그',
    guide: {
      title: '태그로 빠르게 찾기',
      steps: [
        'SaveBoard가 링크에서 태그를 자동 생성해요 (예: #video, #github, #design).',
        '태그는 사이드바에 나타나요 — 하나를 클릭하면 해당 링크만 바로 필터링돼요.',
        '직접 태그 추가: 링크 카드를 열고 편집을 탭한 뒤 태그 칸에 입력하세요.',
        '각 태그 뒤에 Enter를 누르면 추가돼요. Backspace로 마지막 태그를 지워요.',
        '입력하면 기존 태그가 추천으로 떠요 — 탭해서 적용하세요.',
      ],
    },
    faqs: [
      { q: '자동 태그는 어디서 오나요?', a: 'SaveBoard가 링크의 URL·제목·설명을 분석해 #video, #ai, #tutorial, #social 같은 관련 태그를 제안해요.' },
      { q: '자동 생성된 태그를 지울 수 있나요?', a: '자동 태그는 즉석에서 만들어져 삭제할 수 없지만, 다른 컬렉션을 선택해 걸러낼 수 있어요.' },
      { q: '태그는 대소문자를 구분하나요?', a: '아니요 — "AI", "ai", "Ai"는 모두 같은 #ai 태그로 처리돼요.' },
    ],
  },
  'Favorites & Search': {
    title: '즐겨찾기 & 검색',
    faqs: [
      { q: '링크를 즐겨찾기하려면요?', a: '링크 카드의 별 아이콘을 탭하세요. 즐겨찾기한 링크는 사이드바의 즐겨찾기 컬렉션에 나타나요.' },
      { q: '검색은 어떻게 하나요?', a: '헤더의 검색 아이콘을 누르세요(모바일은 하단 네비의 검색). 키워드를 입력하면 제목·설명·URL에서 결과가 즉시 갱신돼요.' },
      { q: '특정 보드 안에서 검색할 수 있나요?', a: '먼저 보드를 선택한 뒤 검색창을 쓰면 현재 보기 안으로 결과가 한정돼요.' },
      { q: '미분류 컬렉션은 뭔가요?', a: '아직 보드에 배정되지 않은 모든 링크를 보여줘서 빠르게 정리할 수 있어요.' },
    ],
  },
  'Views & Layout': {
    title: '보기 & 레이아웃',
    faqs: [
      { q: '어떤 보기 모드가 있나요?', a: '메이슨리(핀터레스트 스타일), 그리드(고정 타일), 리스트(간결한 줄), 칸반(보드 열)이 있어요. 헤더 오른쪽 위 아이콘으로 전환하세요.' },
      { q: '링크를 어떻게 정렬하나요?', a: '콘텐츠 영역 오른쪽 위의 정렬 드롭다운으로 최신순·오래된순·가나다순·역순을 전환하세요.' },
      { q: '여러 링크를 한 번에 삭제하려면요?', a: '헤더에서 선택을 누르고 지울 링크를 각각 탭한 뒤 삭제를 누르세요. 하단에 확인 바가 나타나요.' },
      { q: '앱 테마를 바꿀 수 있나요?', a: '네 — 아바타 → 테마에서 라이트·다크·시스템을 고르세요.' },
    ],
  },
  'Export & Import': {
    title: '내보내기 & 가져오기',
    faqs: [
      { q: '링크를 어떻게 내보내나요?', a: '설정 → 링크 내보내기로 이동하세요. 모든 링크와 보드가 담긴 JSON 파일이 기기에 다운로드돼요.' },
      { q: '링크를 어떻게 가져오나요?', a: '설정 → 링크 가져오기에서 이전에 내보낸 SaveBoard JSON 파일을 선택하세요. 참고: 가져오기는 현재 데이터를 대체해요.' },
      { q: '무료 플랜에서 가져오기가 되나요?', a: '가져오기는 Pro 기능이에요. 내보내기는 모든 플랜에서 가능해요.' },
    ],
  },
  'Account & Data': {
    title: '계정 & 데이터',
    faqs: [
      { q: '언어를 어떻게 바꾸나요?', a: '아바타 → 언어에서 목록에서 선택하세요. 인터페이스 전체가 즉시 바뀌어요.' },
      { q: '제 데이터는 안전한가요?', a: '모든 데이터는 Supabase(PostgreSQL)에 안전하게 저장돼요. 링크는 계정에 비공개예요.' },
      { q: '로그아웃은 어떻게 하나요?', a: '오른쪽 위 아바타를 누르고 메뉴 하단의 로그아웃을 탭하세요.' },
      { q: '무료 플랜 한도는 얼마인가요?', a: '무료 플랜은 링크 30개, 보드 5개까지예요. Pro로 업그레이드하면 무제한 링크·보드·가져오기를 쓸 수 있어요.' },
    ],
  },
};

interface HelpPageProps {
  onClose: () => void;
  onShowContact: () => void;
}

export function HelpPage({ onClose, onShowContact }: HelpPageProps) {
  const { tr, language } = useLanguage();
  const ko = language === 'ko';
  const [search, setSearch] = useState('');
  const [openSection, setOpenSection] = useState<string | null>('Adding Links');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const q = search.toLowerCase();

  // English section.title stays the stable identity; display text comes from
  // SECTION_KO when the UI is Korean. `dTitle`/`dGuide`/`dFaqs` are display-only.
  const localize = (section: Section) => {
    const koText = ko ? SECTION_KO[section.title] : undefined;
    return {
      dTitle: koText?.title ?? section.title,
      dGuide: koText?.guide ?? section.guide,
      dFaqs: koText?.faqs ?? section.faqs,
    };
  };

  const filtered = SECTIONS.map(section => {
    const { dTitle, dGuide, dFaqs } = localize(section);
    if (!q) return { section, dTitle, dGuide, dFaqs };
    const faqs = dFaqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
    const guideMatch = dGuide && (
      dGuide.title.toLowerCase().includes(q) ||
      dGuide.steps.some(s => s.toLowerCase().includes(q))
    );
    if (!faqs.length && !guideMatch && !dTitle.toLowerCase().includes(q)) return null;
    return { section, dTitle, dGuide, dFaqs: guideMatch ? dFaqs : faqs };
  }).filter(Boolean) as { section: Section; dTitle: string; dGuide?: Guide; dFaqs: FAQ[] }[];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9991 }}>
        <div className="min-h-full flex items-center justify-center p-4 py-10">
          <div className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden bg-white">

            {/* Header */}
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">{tr('helpFaq')}</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">{tr('helpSub')}</p>
                </div>
                <button onClick={onClose}
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={tr('searchGuides')}
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  style={{ fontSize: '16px' }}
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch('')} className="shrink-0" style={{ color: '#9CA3AF' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh]">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-[15px] font-semibold text-gray-700">{tr('noResultsFor')} "{search}"</p>
                  <p className="text-[13px] text-gray-400 mt-1">{tr('tryDifferent')}</p>
                </div>
              ) : (
                filtered.map(({ section, dTitle, dGuide, dFaqs }) => {
                  const { icon: Icon, color, bg, title } = section;
                  const guide = dGuide;
                  const faqs = dFaqs;
                  const isOpen = openSection === title || !!search;
                  return (
                    <div key={title} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      {/* Section header */}
                      <button
                        onClick={() => setOpenSection(isOpen && !search ? null : title)}
                        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#FAFAFA'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <span className="flex-1 text-[14px] font-semibold text-gray-800">{dTitle}</span>
                        {!search && (
                          isOpen
                            ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                            : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                        )}
                      </button>

                      {/* Section body */}
                      {isOpen && (
                        <div className="pb-3">
                          {/* How-to guide */}
                          {guide && (
                            <div className="mx-5 mb-3 p-4 rounded-2xl" style={{ background: bg, border: `1px solid ${color}22` }}>
                              <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color }}>{tr('howToGuide')}</p>
                              <p className="text-[13px] font-semibold text-gray-800 mb-2">{guide.title}</p>
                              <ol className="space-y-1.5">
                                {guide.steps.map((step, i) => (
                                  <li key={i} className="flex gap-2.5 text-[12px] text-gray-600">
                                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5"
                                      style={{ background: color, minWidth: '1rem' }}>
                                      {i + 1}
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* FAQs */}
                          {faqs.map(faq => {
                            const faqKey = `${title}::${faq.q}`;
                            const faqOpen = openFaq === faqKey || !!search;
                            return (
                              <div key={faq.q} className="mx-3">
                                <button
                                  onClick={() => setOpenFaq(faqOpen && !search ? null : faqKey)}
                                  className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors"
                                  onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                  <span className="text-[13px] font-medium text-gray-700 flex-1 leading-snug">{faq.q}</span>
                                  {!search && (
                                    faqOpen
                                      ? <ChevronDown className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
                                      : <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
                                  )}
                                </button>
                                {faqOpen && (
                                  <p className="px-3 pb-2.5 text-[12px] leading-relaxed text-gray-500">{faq.a}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer CTA */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
              <div>
                <p className="text-[13px] font-semibold text-gray-700">{tr('stillNeedHelp')}</p>
                <p className="text-[11px] text-gray-400">{tr('replyWithin24')}</p>
              </div>
              <button
                onClick={() => { onClose(); onShowContact(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                <Mail className="w-3.5 h-3.5" />
                {tr('contactUs')}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
