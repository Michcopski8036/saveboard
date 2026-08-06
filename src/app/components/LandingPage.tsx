import { Bookmark, Link2, FileText, Paperclip, StickyNote, Sparkles, Share2, ArrowRight, Check, Smartphone, Shield } from 'lucide-react';
import { Link } from 'react-router';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  onGetStarted: () => void;
}

// Marketing copy lives here (co-located, bilingual) rather than in the shared
// translations dict, which is for short app-chrome labels. Korean users (or
// anyone who picks 한국어) get the Korean landing; everyone else gets English.
const COPY = {
  en: {
    blog: 'Blog',
    guides: 'Guides',
    signIn: 'Sign in',
    getStarted: 'Get Started Free',
    heroBadge: '😩 Sound familiar?',
    heroLine1: 'Stop scrolling.',
    heroLine2pre: 'Find that link ',
    heroLine2em: 'instantly.',
    heroSub: 'Tired of digging through group chats to find a schedule link, registration form, or video someone shared weeks ago? SaveBoard keeps all your important links organised in one beautiful place — for parents, coaches, and group leaders.',
    seeHow: 'See how it works',
    downloadOn: 'Download on the',
    getItOn: 'GET IT ON',
    socialProof: 'Join parents, coaches & group leaders getting organised',
    chatTeam: 'Basketball Team 🏀',
    chatMembers: '12 members',
    chatMsg1: "Here's the registration link for the tournament 👇",
    chatMsg2: 'And the schedule PDF 📅',
    chatThanks: 'Thanks! 🙏',
    chatLater: '3 weeks later...',
    chatLaterQ: '"Where was that registration link again??"',
    chatLaterTag: '3 weeks later',
    cardBoard: 'Basketball',
    cardTitle: 'Tournament Registration 2026',
    problemTitlePre: 'Important links get ',
    problemTitleEm: 'lost',
    problemTitlePost: ' in the scroll',
    problemSub: 'Every busy parent, coach, and group leader knows this pain.',
    problems: [
      { emoji: '📱', title: 'Buried in group chats', desc: 'Schedule links, registration forms, and videos get buried under hundreds of messages. Finding them again takes forever.' },
      { emoji: '🗂️', title: 'Different types, scattered', desc: 'Some links are PDFs, some are websites, some are videos — scattered across WhatsApp, email, and texts.' },
      { emoji: '🔄', title: '"Can you send that link again?"', desc: "Nobody wants to ask — or answer — that question for the fifth time. It's embarrassing and annoying for everyone." },
    ],
    solutionTitlePre: 'One place for ',
    solutionTitleEm: 'all',
    solutionTitlePost: ' your links',
    solutionSub: 'Everything you need to stay organised, all in one place.',
    solutions: [
      { label: 'Beautiful visual cards',   desc: 'Every link becomes a rich preview with image, title, and description.' },
      { label: 'Organise by activity',     desc: 'Create boards for Basketball, Gymnastics, Tennis — each activity tidy and separate.' },
      { label: 'Files, not just links',    desc: 'Attach the PDF itself — the registration form sits right next to the schedule link.' },
      { label: 'Add notes & reminders',    desc: 'Add context like "Register by June 1st" so you never forget the details.' },
      { label: 'Web, iPhone and Android',  desc: 'Save it on your phone, find it on your laptop. The same boards on every device.' },
      { label: 'Private & just yours',     desc: 'Your links are private. No one sees your board unless you choose to share.' },
    ],
    shotsTitle: 'What it looks like on your phone',
    shotsSub: 'Actual screens from the app — nothing here is an illustration.',
    shots: [
      'Every save as a visual card — PDFs, videos and pages side by side.',
      'A board per activity, with tags and favourites down the side.',
      'Move a save into another board in one tap.',
    ],
    howTitle: 'How it works',
    howSub: 'Three steps. Two minutes. Zero lost links.',
    steps: [
      { title: 'Save a link', desc: 'Paste any URL or share from your phone. SaveBoard automatically fetches the title, image and description.' },
      { title: 'Curate your boards', desc: 'Create boards for each activity — Basketball, Gymnastics, Tennis. Keep every link exactly where you need it.' },
      { title: 'Find it instantly', desc: 'Search in seconds. No more "Can you send that link again?" — it\'s always right there when you need it.' },
    ],
    aiBadge: 'AI-powered',
    aiTitle: 'Find anything instantly',
    aiDesc: "SaveBoard automatically tags every link you save — so whether it's a registration form, schedule PDF, or a tournament video, you can find it in seconds without scrolling anywhere.",
    aiPoints: ['Auto-generated tags', 'Full-text search', 'Smart filtering'],
    aiSuggested: 'AI suggested tags',
    shareBadge: 'Sharing',
    shareTitle: 'Share with the whole team',
    shareDesc: 'Share your Basketball or Gymnastics board with other parents — just send a link. No account needed to view it.',
    shareBoardLabel: 'Shared board',
    shareBoardName: 'My Korea Trip 🇰🇷',
    copyLink: 'Copy link',
    founderQuote: '"Three kids, so many group chats, hundreds of messages — and I was spending more time scrolling than actually parenting. Every time I needed a schedule link, I had to scroll forever. I built SaveBoard so nobody has to do that anymore."',
    founderRole: 'Founder of SaveBoard · Mum of 3',
    finalTitle1: 'Never lose a link',
    finalTitleEm: 'again',
    finalSub: 'SaveBoard is free to start. No scrolling required ever again.',
    rights: '© 2026 SaveBoard. All rights reserved.',
  },
  ko: {
    blog: '블로그',
    guides: '가이드',
    signIn: '로그인',
    getStarted: '무료로 시작하기',
    heroBadge: '😩 이런 적 있죠?',
    heroLine1: '그만 스크롤하세요.',
    heroLine2pre: '그 링크를 ',
    heroLine2em: '바로 찾으세요.',
    heroSub: '몇 주 전에 누가 보낸 일정 링크, 신청서, 영상을 찾으려고 단체 채팅을 한참 뒤진 적 있나요? SaveBoard는 중요한 링크를 한 곳에 예쁘게 정리해줘요 — 학부모, 코치, 모임 리더를 위해.',
    seeHow: '어떻게 작동하나요',
    downloadOn: '다운로드',
    getItOn: '다운로드',
    socialProof: '정리 잘하는 학부모·코치·모임 리더와 함께하세요',
    chatTeam: '농구팀 🏀',
    chatMembers: '멤버 12명',
    chatMsg1: '토너먼트 신청 링크 여기요 👇',
    chatMsg2: '그리고 일정 PDF 📅',
    chatThanks: '감사합니다! 🙏',
    chatLater: '3주 뒤...',
    chatLaterQ: '"그 신청 링크 어디 있었지??"',
    chatLaterTag: '3주 뒤',
    cardBoard: '농구',
    cardTitle: '2026 토너먼트 신청',
    problemTitlePre: '중요한 링크는 스크롤 속에서 ',
    problemTitleEm: '사라져요',
    problemTitlePost: '',
    problemSub: '바쁜 학부모·코치·모임 리더라면 다 아는 그 고통.',
    problems: [
      { emoji: '📱', title: '단체 채팅에 묻힘', desc: '일정 링크, 신청서, 영상이 수백 개 메시지 아래 묻혀요. 다시 찾으려면 한참 걸리죠.' },
      { emoji: '🗂️', title: '종류도 제각각, 여기저기', desc: '어떤 건 PDF, 어떤 건 웹사이트, 어떤 건 영상 — 카톡·이메일·문자에 흩어져 있어요.' },
      { emoji: '🔄', title: '"그 링크 다시 보내줄래?"', desc: '다섯 번째로 그 질문을 하거나 답하고 싶은 사람은 없어요. 서로 민망하고 번거롭죠.' },
    ],
    solutionTitlePre: '모든 링크를 ',
    solutionTitleEm: '한',
    solutionTitlePost: ' 곳에',
    solutionSub: '정리에 필요한 모든 것을 한 곳에.',
    solutions: [
      { label: '예쁜 비주얼 카드',        desc: '모든 링크가 이미지·제목·설명이 담긴 미리보기로 바뀌어요.' },
      { label: '활동별로 정리',          desc: '농구, 체조, 테니스 — 활동마다 보드를 만들어 깔끔하게 분리해요.' },
      { label: '링크만이 아니라 파일도',  desc: 'PDF를 그대로 첨부하세요. 신청서가 일정 링크 바로 옆에 놓여요.' },
      { label: '메모 & 알림 추가',       desc: '"6월 1일까지 신청" 같은 메모를 달아 놓치지 않게 하세요.' },
      { label: '웹·아이폰·안드로이드',    desc: '폰에서 저장하고 노트북에서 찾으세요. 모든 기기에 같은 보드.' },
      { label: '오직 나만의 공간',       desc: '내 링크는 비공개예요. 공유하기 전엔 아무도 내 보드를 못 봐요.' },
    ],
    shotsTitle: '폰에서는 이렇게 보여요',
    shotsSub: '그린 이미지가 아니라 앱을 그대로 찍은 화면이에요.',
    shots: [
      '저장한 링크가 카드로 — PDF·영상·웹페이지가 한자리에.',
      '활동별로 보드를 나누고, 옆에 태그와 즐겨찾기.',
      '저장한 링크를 다른 보드로 한 번에 옮기기.',
    ],
    howTitle: '사용 방법',
    howSub: '세 단계. 2분. 잃어버리는 링크 0개.',
    steps: [
      { title: '링크 저장', desc: 'URL을 붙여넣거나 폰에서 공유하세요. SaveBoard가 제목·이미지·설명을 자동으로 가져와요.' },
      { title: '보드 정리', desc: '활동별 보드를 만드세요 — 농구, 체조, 테니스. 모든 링크를 원하는 자리에 딱.' },
      { title: '바로 찾기', desc: '몇 초 만에 검색. "그 링크 다시 보내줄래?" 이제 그만 — 필요할 때 항상 거기 있어요.' },
    ],
    aiBadge: 'AI 기반',
    aiTitle: '뭐든 바로 찾기',
    aiDesc: 'SaveBoard는 저장한 모든 링크에 자동으로 태그를 달아줘요 — 신청서든, 일정 PDF든, 토너먼트 영상이든, 어디도 스크롤할 필요 없이 몇 초 만에 찾을 수 있어요.',
    aiPoints: ['자동 생성 태그', '전체 텍스트 검색', '스마트 필터링'],
    aiSuggested: 'AI 추천 태그',
    shareBadge: '공유',
    shareTitle: '팀 전체와 공유',
    shareDesc: '농구나 체조 보드를 다른 학부모와 공유하세요 — 링크만 보내면 돼요. 보는 데 계정도 필요 없어요.',
    shareBoardLabel: '공유된 보드',
    shareBoardName: '나의 한국 여행 🇰🇷',
    copyLink: '링크 복사',
    founderQuote: '"아이 셋, 수많은 단체 채팅, 수백 개의 메시지 — 육아보다 스크롤에 더 많은 시간을 쓰고 있었어요. 일정 링크가 필요할 때마다 한참을 스크롤해야 했죠. 아무도 그럴 필요 없게 하려고 SaveBoard를 만들었어요."',
    founderRole: 'SaveBoard 창업자 · 세 아이 엄마',
    finalTitle1: '다시는 링크를',
    finalTitleEm: '잃지 마세요',
    finalSub: 'SaveBoard는 무료로 시작해요. 다시는 스크롤할 필요 없이.',
    rights: '© 2026 SaveBoard. All rights reserved.',
  },
} as const;

// Six languages ship in LanguageContext but the landing never said so.
// Written in each language's own name, so it reads regardless of the visitor's.
const LANGS = 'English · 한국어 · 日本語 · 中文 · Español · Français';

export function LandingPage({ onGetStarted }: Props) {
  const { language } = useLanguage();
  const c = COPY[language as keyof typeof COPY] ?? COPY.en;

  // Onboarding means native never reaches this page — but if a future route ever
  // lands here, an iOS build must not render a Google Play badge.
  const isNative = Capacitor.isNativePlatform();

  const solutionMeta = [
    { icon: Link2,      bg: '#EDE9FE', color: '#7C3AED' },
    { icon: FileText,   bg: '#CCFBF1', color: '#0D9488' },
    { icon: Paperclip,  bg: '#FEF9C3', color: '#CA8A04' },
    { icon: StickyNote, bg: '#FFE4E6', color: '#E11D48' },
    { icon: Smartphone, bg: '#DBEAFE', color: '#2563EB' },
    { icon: Shield,     bg: '#DCFCE7', color: '#16A34A' },
  ];
  const stepColors = ['#A259FF', '#FF7262', '#F24E1E'];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[8px] bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E]">
              <Bookmark className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-gray-900">
              Save<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              to="/blog"
              className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {c.blog}
            </Link>
            <Link
              to="/guides"
              className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {c.guides}
            </Link>
            <button
              onClick={onGetStarted}
              className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {c.signIn}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-5">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12 items-center">

          {/* Left — text */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[12px] font-medium text-purple-600 mb-6">
              {c.heroBadge}
            </div>
            <h1 className="text-[44px] sm:text-[54px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
              {c.heroLine1}<br />
              {c.heroLine2pre}
              <span className="italic bg-gradient-to-r from-[#A259FF] to-[#F24E1E] bg-clip-text text-transparent">
                {c.heroLine2em}
              </span>
            </h1>
            <p className="text-[17px] text-gray-500 leading-relaxed mb-10 max-w-md">
              {c.heroSub}
            </p>
            <div className="flex gap-3 flex-wrap mb-10">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
              >
                {c.getStarted}
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-200 bg-white text-gray-600 rounded-2xl font-medium text-[15px] hover:border-[#A259FF] hover:text-[#A259FF] transition-colors"
              >
                {c.seeHow}
              </a>
            </div>
            {/* App store download badges */}
            {!isNative && (
            <div className="flex gap-3 flex-wrap -mt-6 mb-10">
              <a href="https://apps.apple.com/app/id6770486850" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-black text-white rounded-xl hover:opacity-90 active:scale-95 transition-all">
                <svg viewBox="0 0 384 512" className="w-6 h-6 fill-white" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C71.4 141.6 16 184.6 16 272c0 26.1 4.8 53 14.3 80.7 12.8 36.9 58.9 127.3 107 125.8 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.3-83 102.5-120-65.2-30.7-61.7-90-61.3-89.8zM254.4 70.7c19.1-22.9 17.4-43.8 16.8-51.3-16.9.9-36.5 11.5-47.6 24.5-12.3 14-19.5 31.4-17.9 50.7 18.3 1.4 35-8 48.7-23.9z"/></svg>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] opacity-80">{c.downloadOn}</span>
                  <span className="block text-[16px] font-semibold -mt-0.5">App Store</span>
                </span>
              </a>
              <a href="https://play.google.com/store/apps/details?id=app.saveboard.saveboard" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-black text-white rounded-xl hover:opacity-90 active:scale-95 transition-all">
                <svg viewBox="0 0 512 512" className="w-6 h-6" aria-hidden="true">
                  <path fill="#00D9FF" d="M48 59.5C45.5 62.9 44 67.9 44 74.3v363.4c0 6.4 1.5 11.4 4 14.8l1.2 1.2 203.5-203.5v-4.8L49.2 58.3 48 59.5z"/>
                  <path fill="#FFD500" d="M320.5 322.5l-67.8-67.8v-4.8l67.9-67.9 1.5.9 80.4 45.7c23 13 23 34.3 0 47.4l-80.4 45.7-1.6.8z"/>
                  <path fill="#FF3333" d="M322 321.6l-69.3-69.3L48 457c7.6 8 20.1 9 34.2 1L322 321.6z"/>
                  <path fill="#00F076" d="M322 182.9L82.2 47C68.1 39 55.6 40 48 48l204.7 204.4L322 182.9z"/>
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] opacity-80">{c.getItOn}</span>
                  <span className="block text-[16px] font-semibold -mt-0.5">Google Play</span>
                </span>
              </a>
            </div>
            )}
            <div className="flex items-center gap-3">
              <div className="flex">
                {['🧑‍🦰','👩','🧑','👩‍🦱'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[14px] -ml-2 first:ml-0"
                    style={{ background: ['#FDE68A','#BBF7D0','#BFDBFE','#FCA5A5'][i] }}>
                    {e}
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-gray-500">{c.socialProof}</span>
            </div>
          </div>

          {/* Right — WhatsApp chat mockup */}
          <div>
            <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200 overflow-hidden border border-gray-100 max-w-[360px] mx-auto">
              {/* Chat header */}
              <div className="bg-[#075E54] px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-[18px]">🏀</div>
                <div>
                  <p className="text-white text-[15px] font-medium">{c.chatTeam}</p>
                  <p className="text-white/70 text-[12px]">{c.chatMembers}</p>
                </div>
              </div>
              {/* Chat body */}
              <div className="bg-[#ECE5DD] px-4 py-4 flex flex-col gap-2.5">
                {/* Incoming message 1 */}
                <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] text-[13px] text-gray-800">
                  {c.chatMsg1}
                  <div className="mt-1.5 bg-gray-100 border-l-[3px] border-[#25D366] rounded px-2 py-1.5 text-[11px] text-[#128C7E] break-all">
                    sports.com/tournament/registration/2026/season-b-u12...
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-right">Mon 9:14 AM</p>
                </div>
                {/* Incoming message 2 */}
                <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] text-[13px] text-gray-800">
                  {c.chatMsg2}
                  <div className="mt-1.5 bg-gray-100 border-l-[3px] border-[#25D366] rounded px-2 py-1.5 text-[11px] text-[#128C7E] break-all">
                    drive.google.com/file/d/1BxiMVs8pp3nZ3yPQh...
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-right">Mon 9:15 AM</p>
                </div>
                {/* Outgoing message */}
                <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%] self-end text-[13px] text-gray-800">
                  {c.chatThanks}
                  <p className="text-[10px] text-gray-400 mt-1 text-right">9:20 AM</p>
                </div>
                {/* 3 weeks later callout */}
                <div className="bg-amber-50 border-l-[3px] border-amber-400 rounded-xl px-3 py-2 max-w-[90%] text-[12px] text-amber-800">
                  😩 <em>{c.chatLater}</em><br />{c.chatLaterQ}
                  <p className="text-[10px] text-amber-500 mt-1 text-right">{c.chatLaterTag}</p>
                </div>
              </div>
            </div>

            {/* Transform arrow + SaveBoard card */}
            <div className="flex items-center gap-4 mt-5 max-w-[360px] mx-auto">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-11 h-11 rounded-full bg-[#A259FF] flex items-center justify-center text-white text-[20px]">→</div>
                <span className="text-[11px] text-gray-400">SaveBoard</span>
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md">
                <div className="h-[68px] bg-gradient-to-br from-[#A259FF] to-[#F24E1E] flex items-center justify-center text-[26px]">🏀</div>
                <div className="p-3">
                  <span className="text-[10px] font-medium text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full">{c.cardBoard}</span>
                  <p className="text-[13px] font-semibold text-gray-900 mt-1.5">{c.cardTitle}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">sports.com/tournament/registration...</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Problem */}
      <section className="py-16 px-5 bg-gradient-to-br from-[#F5F3FF] to-[#FFF7ED]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">
            {c.problemTitlePre}
            <span className="italic bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">{c.problemTitleEm}</span>
            {c.problemTitlePost}
          </h2>
          <p className="text-gray-500 text-center mb-10 text-[16px]">{c.problemSub}</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {c.problems.map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-[28px] mb-3">{emoji}</div>
                <p className="font-semibold text-gray-900 text-[15px] mb-1.5">{title}</p>
                <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real app screens — the mockups above are illustrations; these are the product */}
      <section className="py-16 px-5 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">{c.shotsTitle}</h2>
          <p className="text-gray-500 text-center mb-12 text-[16px]">{c.shotsSub}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {[
              { src: '/app/app-saves.jpg', alt: c.shots[0] },
              { src: '/app/app-boards.jpg', alt: c.shots[1] },
              { src: '/app/app-boards-move.jpg', alt: c.shots[2] },
            ].map(({ src, alt }, i) => (
              <figure key={src} className="flex flex-col items-center gap-4">
                <img
                  src={src}
                  alt={alt}
                  width={430}
                  height={935}
                  loading="lazy"
                  className="w-[190px] sm:w-full max-w-[220px] rounded-[22px] border border-gray-200 shadow-xl shadow-gray-200"
                />
                <figcaption className="text-[13px] text-gray-500 leading-relaxed text-center max-w-[240px]">
                  {c.shots[i]}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">
            {c.solutionTitlePre}
            <span className="italic bg-gradient-to-r from-[#A259FF] to-[#F24E1E] bg-clip-text text-transparent">{c.solutionTitleEm}</span>
            {c.solutionTitlePost}
          </h2>
          <p className="text-gray-500 text-center mb-10 text-[16px]">{c.solutionSub}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {c.solutions.map(({ label, desc }, i) => {
              const Icon = solutionMeta[i].icon;
              return (
                <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: solutionMeta[i].bg }}>
                    <Icon className="w-5 h-5" style={{ color: solutionMeta[i].color }} />
                  </div>
                  <p className="font-semibold text-gray-900 text-[14px] mb-1">{label}</p>
                  <p className="text-[12px] text-gray-500 leading-snug">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">{c.howTitle}</h2>
          <p className="text-gray-500 text-center mb-12 text-[16px]">{c.howSub}</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {c.steps.map(({ title, desc }, i) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-[18px] mx-auto mb-4 shadow-lg"
                  style={{ background: stepColors[i], boxShadow: `0 8px 24px ${stepColors[i]}40` }}>
                  {i + 1}
                </div>
                <h3 className="font-bold text-gray-900 text-[16px] mb-2">{title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* AI feature highlight */}
      <section className="py-16 px-5 bg-gradient-to-br from-[#F5F3FF] to-[#FFF7ED]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[12px] font-medium text-purple-600 mb-4">
              <Sparkles className="w-3 h-3" />
              {c.aiBadge}
            </div>
            <h2 className="text-[28px] font-bold text-gray-900 mb-3">{c.aiTitle}</h2>
            <p className="text-[15px] text-gray-500 leading-relaxed mb-5">
              {c.aiDesc}
            </p>
            {c.aiPoints.map(item => (
              <div key={item} className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-purple-600" />
                </div>
                <span className="text-[13px] text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-full max-w-[260px]">
              <p className="text-[11px] text-gray-400 mb-2 font-medium">{c.aiSuggested}</p>
              <div className="flex flex-wrap gap-1.5">
                {['productivity','learning','science','technology','design','health','food','travel'].map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Share feature */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row-reverse items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[12px] font-medium text-orange-500 mb-4">
              <Share2 className="w-3 h-3" />
              {c.shareBadge}
            </div>
            <h2 className="text-[28px] font-bold text-gray-900 mb-3">{c.shareTitle}</h2>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              {c.shareDesc}
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-gradient-to-br from-[#A259FF] to-[#F24E1E] rounded-2xl p-px shadow-xl w-full max-w-[260px]">
              <div className="bg-white rounded-[15px] p-5">
                <p className="text-[11px] text-gray-400 mb-1 font-medium">{c.shareBoardLabel}</p>
                <p className="text-[14px] font-bold text-gray-900 mb-3">{c.shareBoardName}</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-[11px] text-gray-500 font-mono break-all">
                  saveboard.app/share/abc123
                </div>
                <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white text-[12px] font-semibold">
                  {c.copyLink}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section className="py-16 px-5 bg-amber-50 border-y border-amber-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[20px] sm:text-[24px] text-gray-900 leading-relaxed mb-6"
            style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontWeight: 300 }}>
            {c.founderQuote}
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A259FF] to-[#F24E1E] flex items-center justify-center text-xl">👩</div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-[15px]">Mihee</p>
              <p className="text-[13px] text-gray-500">{c.founderRole}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-5 text-center bg-gray-50">
        <div className="max-w-xl mx-auto">
          <h2 className="text-[36px] font-extrabold text-gray-900 mb-4 leading-tight">
            {c.finalTitle1}<br />
            <span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">
              {c.finalTitleEm}
            </span>
          </h2>
          <p className="text-gray-500 mb-8 text-[16px]">{c.finalSub}</p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-semibold text-[16px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
          >
            {c.getStarted}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-[6px] bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E]">
              <Bookmark className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-gray-900">
              Save<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors">{c.blog}</Link>
            <Link to="/guides" className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors">{c.guides}</Link>
            <p className="text-[12px] text-gray-400">{c.rights}</p>
          </div>
        </div>
        <p className="max-w-5xl mx-auto mt-4 text-center sm:text-left text-[12px] text-gray-400">
          {LANGS}
        </p>
      </footer>

    </div>
  );
}
