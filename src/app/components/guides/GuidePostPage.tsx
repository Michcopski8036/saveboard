import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router';
import { ArrowLeft, ArrowRight, Calendar, Languages } from 'lucide-react';
import { getGuideByRouteSlug } from '../../utils/guideUtils';
import { formatDate } from '../../utils/blogUtils';
import { renderMarkdown } from '../../utils/markdownRenderer';
import { Nav, BlogFooter } from '../blog/BlogListPage';
import { track } from '../../lib/track';

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
  // The board CTA belongs with the list, above the FAQ — the FAQ is reference
  // material people scroll past, not the note to end the piece on.
  const [beforeFaq, faqSection] = splitAtFaq(body);
  // Own-app disclosure banner (promo_* frontmatter): sits right after the intro,
  // before the first H2, so it's seen without scrolling. Guides without the
  // frontmatter take the single-article path exactly as before.
  const hasPromo = Boolean(guide.promoUrl && guide.promoText);
  const [intro, afterIntro] = hasPromo ? splitAtFirstSection(beforeFaq) : [beforeFaq, ''];
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
            {renderMarkdown(intro)}
          </article>

          {hasPromo && (
            <aside className="my-9 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-lg shadow-purple-100">
              {guide.promoImage && (
                <a href={guide.promoUrl} aria-label={guide.promoCta}>
                  <img
                    src={guide.promoImage}
                    alt={guide.promoImageAlt}
                    width={Number(guide.promoImageW) || undefined}
                    height={Number(guide.promoImageH) || undefined}
                    loading="lazy"
                    className="block w-full h-auto"
                  />
                </a>
              )}
              <div className="p-6 sm:p-8">
                <p className="text-[12px] font-bold uppercase tracking-wider text-purple-600 mb-2">
                  {guide.promoNote}
                </p>
                {guide.promoTitle && (
                  <h2 className="text-[23px] sm:text-[27px] font-extrabold text-gray-900 leading-tight mb-3">
                    {guide.promoTitle}
                  </h2>
                )}
                <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
                  {guide.promoText}
                </p>
                <a
                  href={guide.promoUrl}
                  className="flex sm:inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-bold text-[16px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
                >
                  {guide.promoCta}
                  <ArrowRight className="w-5 h-5" />
                </a>
                {guide.promoFine && (
                  <p className="text-[12px] text-gray-400 mt-4">{guide.promoFine}</p>
                )}
              </div>
            </aside>
          )}

          {afterIntro && (
            <article className="prose-style">
              {renderMarkdown(afterIntro)}
            </article>
          )}

          {guide.boardUrl && (
            <div className="mt-10 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-8">
              <div className="flex flex-col sm:flex-row items-center gap-7">
                <img
                  src={guide.boardImage || '/guides/shared-board-app.jpg'}
                  alt={ko ? '이 리스트의 보드를 휴대폰에서 연 화면' : 'This guide’s board open on a phone'}
                  loading="lazy"
                  className="w-44 sm:w-48 shrink-0 rounded-xl shadow-md border border-purple-100"
                />
                <div className="text-center sm:text-left">
                  <p className="text-[13px] font-semibold text-purple-600 mb-2">
                    {ko ? '이 리스트, 보드로 가져가기' : 'Take this list with you'}
                  </p>
                  <h2 className="text-[23px] font-extrabold text-gray-900 mb-3">
                    {ko ? '한 번에 저장하고, 필요할 때 꺼내보기' : 'Save it once, open it whenever'}
                  </h2>
                  <p className="text-[15px] text-gray-500 mb-6">
                    {ko
                      ? '로그인 없이 열려요. 내 보드로 가져가면 다음에 약속 잡을 때 다시 검색하지 않아도 되고, 직접 찾은 곳도 더할 수 있어요.'
                      : 'Opens without a login. Copy it to your own board and you won’t be searching for these again next time — and you can add your own finds.'}
                  </p>
                  {/* Plain <a>: /share/<token> is a different react-router route that
                      reads the board fresh; a client-side Link is fine, but an <a>
                      also works when this page is opened from prerendered HTML. */}
                  <a
                    href={guide.boardUrl}
                    onClick={() => track('board_click', { slug: guide.slug, lang: guide.lang })}
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
                  >
                    {ko ? '보드 열기' : 'Open the board'}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {faqSection && (
            <article className="prose-style mt-4">
              {renderMarkdown(faqSection)}
            </article>
          )}
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}

/** Splits at the first H2 so the promo banner can sit right after the intro. */
function splitAtFirstSection(md: string): [string, string] {
  const match = md.match(/\n(?=##\s)/);
  if (!match || match.index === undefined) return [md, ''];
  return [md.slice(0, match.index).trim(), md.slice(match.index).trim()];
}

/** Splits a guide's body at its FAQ heading so the board CTA can sit between. */
function splitAtFaq(md: string): [string, string] {
  const match = md.match(/\n(?=##\s+(?:FAQ|Frequently Asked Questions|자주 묻는 질문))/i);
  if (!match || match.index === undefined) return [md, ''];
  return [md.slice(0, match.index).trim(), md.slice(match.index).trim()];
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
