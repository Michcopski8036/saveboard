import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router';
import { ArrowLeft, ArrowRight, Calendar, Languages } from 'lucide-react';
import { getGuideByRouteSlug } from '../../utils/guideUtils';
import { formatDate } from '../../utils/blogUtils';
import { renderMarkdown } from '../../utils/markdownRenderer';
import { Nav, BlogFooter } from '../blog/BlogListPage';

const BASE_URL = 'https://www.saveboard.app';

export function GuidePostPage() {
  const { slug } = useParams<{ slug: string }>();
  const found = getGuideByRouteSlug(slug ?? '');
  const guide = found?.guide;
  const ko = guide?.lang === 'ko';

  useEffect(() => {
    if (!guide) return;
    const canonical = `${BASE_URL}/guides/${guide.slug}${guide.lang === 'ko' ? '-ko' : ''}`;
    document.title = `${guide.title} — SaveBoard Guides`;
    setMeta('description', guide.description);
    setMeta('og:title', `${guide.title} — SaveBoard Guides`);
    setMeta('og:description', guide.description);
    setCanonical(canonical);
    return () => {
      document.title = 'SaveBoard — Stop scrolling. Find that link instantly.';
      setMeta('description', 'Tired of losing links in group chats? SaveBoard organises all your important links in one beautiful place.');
      setCanonical(BASE_URL);
    };
  }, [guide]);

  if (!guide) return <Navigate to="/guides" replace />;

  // The markdown repeats the title as its own H1; the header below renders it.
  const body = guide.content.replace(/^#\s+.*\r?\n+/, '');
  const otherHref = `/guides/${guide.slug}${ko ? '' : '-ko'}`;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />

      <main className="pt-24 pb-20 px-5">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center justify-between gap-4 mb-10">
            <Link
              to="/guides"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {ko ? '전체 가이드' : 'All guides'}
            </Link>
            <Link
              to={otherHref}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              {ko ? 'English' : '한국어'}
            </Link>
          </div>

          <header className="mb-10">
            <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-4">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(guide.date)}
            </div>
            <h1 className="text-[34px] sm:text-[42px] font-extrabold text-gray-900 leading-[1.12] tracking-tight mb-5">
              {guide.title}
            </h1>
            <p className="text-[17px] text-gray-500 leading-relaxed border-l-4 border-purple-200 pl-4">
              {guide.description}
            </p>
          </header>

          <div className="h-px bg-gray-100 mb-10" />

          <article className="prose-style">
            {renderMarkdown(body)}
          </article>

          {guide.boardUrl && (
            <div className="mt-16 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-8 text-center">
              <p className="text-[13px] font-semibold text-purple-600 mb-2">
                {ko ? '이 리스트, 보드로 가져가기' : 'Take this list with you'}
              </p>
              <h2 className="text-[23px] font-extrabold text-gray-900 mb-3">
                {ko ? '휴대폰에서 한 번에 열기' : 'Open the whole list on your phone'}
              </h2>
              <p className="text-[15px] text-gray-500 mb-6 max-w-sm mx-auto">
                {ko
                  ? '로그인 없이 열려요. 각 가게로 한 번에 이동하고, 내 계정으로 가져가 직접 찾은 곳을 더할 수도 있어요.'
                  : 'No login needed. One tap to each place — and you can copy it into your own account and add your own finds.'}
              </p>
              {/* Plain <a>: /share/<token> is a different react-router route that
                  reads the board fresh; a client-side Link is fine, but an <a>
                  also works when this page is opened from prerendered HTML. */}
              <a
                href={guide.boardUrl}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
              >
                {ko ? '보드 열기' : 'Open the board'}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}

function setMeta(name: string, content: string) {
  const isProp = name.startsWith('og:');
  const attr = isProp ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', href);
}
