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
