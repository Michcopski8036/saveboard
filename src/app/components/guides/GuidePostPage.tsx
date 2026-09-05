import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router';
import { ArrowLeft, ArrowRight, Calendar, Languages } from 'lucide-react';
import { getGuideByRouteSlug } from '../../utils/guideUtils';
import { formatDate } from '../../utils/blogUtils';
import { renderMarkdown } from '../../utils/markdownRenderer';
import { Nav, BlogFooter } from '../blog/BlogListPage';
import { PromoCard, hasPromoCard, splitAtFirstSection } from '../PromoCard';
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
    // Mirrors the prerendered title in scripts/prerender-seo.mjs.
    // Korean stops at 'SaveBoard' — matches withSeo() in scripts/prerender-seo.mjs
    // (commit f4c6ad1e, Naver's 40-character title). The rendered title is the one
    // Google keeps, so leaving '가이드' here undid that change on every Korean guide.
    const suffix = guide.lang === 'ko' ? 'SaveBoard' : 'SaveBoard Guides';
    document.title = `${guide.title} — ${suffix}`;
    setMeta('description', guide.description);
    setMeta('og:title', `${guide.title} — ${suffix}`);
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
  const hasPromo = hasPromoCard(guide);
  const [intro, afterIntro] = hasPromo ? splitAtFirstSection(beforeFaq) : [beforeFaq, ''];
  // Only offer the other language when that file actually exists — a
  // Korean-only guide has no English page, and a link to one would 404.
  const otherLang = ko ? found?.pair.en : found?.pair.ko;
  const otherHref = otherLang ? `/guides/${guide.slug}${ko ? '' : '-ko'}` : '';

  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />

      <main className="pt-24 pb-20 px-5">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center justify-between gap-4 mb-10">
            <Link
              to={ko ? '/guides-ko' : '/guides'}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {ko ? '전체 가이드' : 'All guides'}
            </Link>
            {otherHref ? (
              <Link
                to={otherHref}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Languages className="w-3.5 h-3.5" />
                {ko ? 'English' : '한국어'}
              </Link>
            ) : null}
          </div>

          <header className="mb-10">
            <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-4">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(guide.date, guide.lang)}
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

          {hasPromo && <PromoCard promo={guide} ko={ko} />}

          {afterIntro && (
            <article className="prose-style">
              {renderMarkdown(afterIntro)}
            </article>
          )}

          {guide.boardUrl && (
            /* Colour scheme is the pre-redesign board card (founder call:
               light purple-50→pink-50 with the brand-gradient button, not the
               solid purple) — the ad copy and layout stay. */
            <aside
              aria-label={ko ? '광고' : 'Advertisement'}
              className="mt-10 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row items-center gap-7">
                <img
                  src={guide.boardImage || '/guides/shared-board-app.jpg'}
                  alt={ko ? '이 리스트의 보드를 휴대폰에서 연 화면' : 'This guide’s board open on a phone'}
                  loading="lazy"
                  className="w-56 sm:w-48 shrink-0 rounded-xl shadow-md border border-purple-100"
                />
                {/* 폰에서도 왼쪽 정렬. 5줄짜리 본문을 가운데 정렬하면 줄마다 시작점을
                    다시 찾아야 하고, 같은 페이지의 promo 카드는 왼쪽 정렬이라 형제
                    카드 둘이 다른 규칙을 쓰게 된다. */}
                <div className="text-left">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-purple-600 mb-2">
                    {ko ? '이 리스트를 SaveBoard 보드로' : 'This list as a SaveBoard board'}
                  </p>
                  <p className="text-[19px] sm:text-[21px] font-bold text-gray-900 leading-tight mb-3">
                    {ko ? '링크 하나하나 확인하기 번거로우시죠?' : 'Tired of checking links one by one?'}
                  </p>
                  <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
                    {ko
                      ? '이 페이지의 모든 링크를 한번에 한곳에 모아 보세요. 전부 SaveBoard 보드 하나에 비주얼 카드로 정리돼 있어요 — 로그인 없이 열리고, 내 보드로 가져가면 다음에 다시 검색하지 않아도 돼요.'
                      : 'See every link on this page in one go — they’re all on a single SaveBoard board, laid out as visual cards. It opens without a login, and if you copy it to your own board you won’t be searching for these again.'}
                  </p>
                  {/* Plain <a>: /share/<token> is a different react-router route that
                      reads the board fresh; a client-side Link is fine, but an <a>
                      also works when this page is opened from prerendered HTML. */}
                  <a
                    href={guide.boardUrl}
                    onClick={() => track('board_click', { slug: guide.slug, lang: guide.lang })}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-bold text-[15px] hover:opacity-90 active:scale-95 transition-all [text-shadow:0_1px_2px_rgba(0,0,0,.35)] shadow-lg shadow-purple-200"
                  >
                    {ko ? '모든 링크 한곳에서 열기' : 'Open all the links in one place'}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </aside>
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
