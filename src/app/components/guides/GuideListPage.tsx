import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { guidePairs } from '../../utils/guideUtils';
import { formatDate } from '../../utils/blogUtils';
import { Nav, BlogFooter } from '../blog/BlogListPage';
import { useLanguage } from '../../context/LanguageContext';
import { CARD_STRIP_GRADIENT } from '../../lib/brand';

const BASE_URL = 'https://www.saveboard.app';

export function GuideListPage() {
  const { language } = useLanguage();
  const ko = language === 'ko';

  useEffect(() => {
    document.title = 'Guides — SaveBoard';
    setMeta('description', 'Researched, ranked lists — every item checked against its own source, and every list opens as a board you can keep.');
    setCanonical(`${BASE_URL}/guides`);
    return () => {
      document.title = 'SaveBoard — Stop scrolling. Find that link instantly.';
      setMeta('description', 'Tired of losing links in group chats? SaveBoard organises all your important links in one beautiful place.');
      setCanonical(BASE_URL);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />

      <main className="pt-24 pb-20 px-5">
        <div className="max-w-5xl mx-auto">

          <div className="mb-14 text-center">
            <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-4">
              <CheckCircle className="w-3.5 h-3.5" />
              {ko ? '직접 확인한 리스트' : 'Checked, then listed'}
            </p>
            <h1 className="text-[44px] sm:text-[54px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-4">
              {ko ? '읽고, 보드로 가져가세요' : 'Read it, then keep it'}
            </h1>
            <p className="text-[17px] text-gray-500 max-w-xl mx-auto leading-relaxed">
              {ko
                ? '순위를 매긴 리스트를 만듭니다. 각 항목은 원본 출처로 직접 확인하고, 리스트 전체는 휴대폰에서 바로 여는 보드로도 저장해 둡니다.'
                : 'Ranked lists, researched one item at a time. Every entry is checked against its own source, and each list also exists as a board you can open on your phone.'}
            </p>
          </div>

          {guidePairs.length === 0 ? (
            <p className="text-center text-gray-400">{ko ? '아직 가이드가 없어요.' : 'No guides yet.'}</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {guidePairs.map(pair => {
                const guide = ko ? pair.ko : pair.en;
                const href = ko ? `/guides/${pair.slug}-ko` : `/guides/${pair.slug}`;
                return (
                  <Link
                    key={pair.slug}
                    to={href}
                    className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="h-0.5" style={{ background: CARD_STRIP_GRADIENT }} />
                    <div className="p-6 flex flex-col flex-1">
                      <p className="text-[12px] text-gray-400 mb-3">{formatDate(pair.date, language)}</p>
                      <h2 className="text-[19px] font-bold text-gray-900 leading-snug mb-3 group-hover:text-purple-700 transition-colors">
                        {guide.title}
                      </h2>
                      <p className="text-[14px] text-gray-500 leading-relaxed flex-1">
                        {guide.description}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-purple-600">
                        {ko ? '리스트 보기' : 'Read the list'} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', href);
}
