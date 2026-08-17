import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router';
import { ArrowLeft, ArrowRight, Calendar, Languages } from 'lucide-react';
import { getGuideByRouteSlug } from '../../utils/guideUtils';
import { formatDate } from '../../utils/blogUtils';
import { renderMarkdown } from '../../utils/markdownRenderer';
import { Nav, BlogFooter } from '../blog/BlogListPage';
import { track } from '../../lib/track';

const BASE_URL = 'https://www.saveboard.app';

/**
 * Promo card palettes, keyed by `promo_theme` frontmatter. `default` is the
 * SaveBoard purple used by the CourtClock banner; `rose` is PeriodVol's
 * rose/mauve tokens (bg #FBF7F4 / rose #F6E2DD / mauve #8A5A6B / blood #D23B26)
 * so the two brands don't wear the same jacket.
 */
const PROMO_THEMES: Record<string, { card: string; imgCol: string; eyebrow: string; cta: string }> = {
  default: {
    card: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-purple-100',
    imgCol: 'bg-[#171310]',
    eyebrow: 'text-purple-600',
    cta: 'bg-gradient-to-r from-[#A259FF] to-[#FF7262] shadow-purple-200',
  },
  rose: {
    card: 'bg-gradient-to-br from-[#FBF7F4] to-[#F6E2DD] border-[#EBDED7] shadow-rose-100',
    imgCol: 'bg-[#FBF7F4]',
    eyebrow: 'text-[#8A5A6B]',
    cta: 'bg-gradient-to-r from-[#D23B26] to-[#8A5A6B] shadow-rose-200',
  },
};

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
  const promoTheme = PROMO_THEMES[guide.promoTheme] ?? PROMO_THEMES.default;
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
            <aside className={`my-9 rounded-2xl overflow-hidden border shadow-lg ${promoTheme.card}`}>
              {/* Portrait screenshot: side-by-side from 821px, stacked below —
                  the image is never cropped (no object-cover) because the
                  screenshot's top-to-bottom sequence is the story. */}
              <div className="flex flex-col min-[821px]:flex-row">
                {guide.promoImage && (
                  <a
                    href={guide.promoUrl}
                    aria-label={guide.promoCta}
                    className={`block shrink-0 min-[821px]:w-[44%] min-[821px]:flex min-[821px]:items-center ${promoTheme.imgCol}`}
                  >
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
                <div className="p-6 sm:p-8 flex flex-col justify-center">
                  <p className={`text-[12px] font-bold uppercase tracking-wider mb-2 ${promoTheme.eyebrow}`}>
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
                    className={`flex min-[821px]:inline-flex items-center justify-center gap-2 px-8 py-4 text-white rounded-2xl font-bold text-[16px] hover:opacity-90 active:scale-95 transition-all shadow-lg self-start w-full min-[821px]:w-auto ${promoTheme.cta}`}
                  >
                    {guide.promoCta}
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  {guide.promoFine && (
                    <p className="text-[12px] text-gray-400 mt-4">{guide.promoFine}</p>
                  )}
                </div>
              </div>
            </aside>
          )}

          {afterIntro && (
            <article className="prose-style">
              {renderMarkdown(afterIntro)}
            </article>
          )}

          {guide.boardUrl && (
            /* Brand-purple gradient with a white CTA — the inverse of the promo
               card's light-background/gradient-button scheme, so the two ads can
               share the basketball page without blurring together. */
            <div className="mt-10 rounded-2xl overflow-hidden bg-gradient-to-br from-[#A259FF] to-[#6B2FD6] p-7 sm:p-8 shadow-lg shadow-purple-200">
              <div className="flex flex-col sm:flex-row items-center gap-7">
                <img
                  src={guide.boardImage || '/guides/shared-board-app.jpg'}
                  alt={ko ? '이 리스트의 보드를 휴대폰에서 연 화면' : 'This guide’s board open on a phone'}
                  loading="lazy"
                  className="w-44 sm:w-48 shrink-0 rounded-xl shadow-lg border border-white/20"
                />
                <div className="text-center sm:text-left">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-white/70 mb-2">
                    {ko ? '이 리스트를 SaveBoard 보드로' : 'This list as a SaveBoard board'}
                  </p>
                  <h2 className="text-[23px] sm:text-[26px] font-extrabold text-white leading-tight mb-3">
                    {ko ? '링크 하나하나 확인하기 번거로우시죠?' : 'Tired of checking links one by one?'}
                  </h2>
                  <p className="text-[15px] text-white/85 leading-relaxed mb-6">
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
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-[#6B2FD6] rounded-2xl font-bold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-lg"
                  >
                    {ko ? '모든 링크 한곳에서 열기' : 'Open all the links in one place'}
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
