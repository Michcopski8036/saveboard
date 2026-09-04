import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { getPostBySlug, getPostByRoute, formatDate } from '../../utils/blogUtils';
import { renderMarkdown } from '../../utils/markdownRenderer';
import { Nav, BlogFooter } from './BlogListPage';
import { useLanguage } from '../../context/LanguageContext';

const BASE_URL = 'https://www.saveboard.app';

/**
 * `landingRoute` renders a top-level landing (`/pocket-alternative-ko`) instead
 * of a `/blog/:slug` post. Without it those URLs fall through to <App/> and a
 * human — or a crawler that runs the JS — gets the marketing page while only the
 * prerendered HTML holds the article.
 */
export function BlogPostPage({ landingRoute }: { landingRoute?: string } = {}) {
  const { language } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const post = landingRoute ? getPostByRoute(landingRoute) : getPostBySlug(slug ?? '');
  // A Korean page stays Korean even for a reader whose UI language is English:
  // the article itself is Korean, so English chrome around it reads as a bug.
  const ko = post?.lang === 'ko' || language === 'ko';
  const isLanding = Boolean(landingRoute);

  // Landings live at /<route>; /blog/<slug> would be a duplicate URL competing with it.
  useEffect(() => {
    if (!isLanding && post?.route) window.location.replace(`/${post.route}`);
  }, [post, isLanding]);

  useEffect(() => {
    if (!post || (!isLanding && post.route)) return;
    // Mirrors withSeo() in scripts/prerender-seo.mjs. If these drift, the title a
    // crawler reads in the HTML and the one it reads after running the JS differ.
    const title = isLanding
      ? (post.title.includes('SaveBoard') ? post.title : `${post.title} — SaveBoard`)
      : `${post.title} — SaveBoard${post.lang === 'ko' ? '' : ' Blog'}`;
    const canonical = isLanding ? `${BASE_URL}/${post.route}` : `${BASE_URL}/blog/${post.slug}`;
    const prevLang = document.documentElement.lang;
    document.title = title;
    setMeta('description', post.description);
    setMeta('og:title', title);
    setMeta('og:description', post.description);
    setCanonical(canonical);
    if (post.lang === 'ko') document.documentElement.lang = 'ko-KR';
    return () => {
      document.documentElement.lang = prevLang;
      document.title = 'SaveBoard — Stop scrolling. Find that link instantly.';
      setMeta('description', 'Tired of losing links in group chats? SaveBoard organises all your important links in one beautiful place.');
      setCanonical(BASE_URL);
    };
  }, [post, isLanding]);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />

      <main className="pt-24 pb-20 px-5">
        <div className="max-w-2xl mx-auto">

          <Link
            to={isLanding ? (ko ? '/guides-ko' : '/blog') : '/blog'}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isLanding ? (ko ? 'SaveBoard 가이드' : 'SaveBoard blog') : ko ? '전체 글' : 'All articles'}
          </Link>

          <header className="mb-10">
            <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-4">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.date, post.lang)}
            </div>
            <h1 className="text-[36px] sm:text-[44px] font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-5">
              {post.title}
            </h1>
            <p className="text-[18px] text-gray-500 leading-relaxed border-l-4 border-purple-200 pl-4">
              {post.description}
            </p>
          </header>

          <div className="h-px bg-gray-100 mb-10" />

          <article className="prose-style">
            {renderMarkdown(post.content)}
          </article>

          <div className="mt-16 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-8 text-center">
            <p className="text-[13px] font-semibold text-purple-600 mb-2">{ko ? '써볼 준비 됐나요?' : 'Ready to try it?'}</p>
            <h2 className="text-[24px] font-extrabold text-gray-900 mb-3">
              {ko ? '오늘부터 링크를 저장해보세요' : 'Start saving links from WhatsApp today'}
            </h2>
            <p className="text-[15px] text-gray-500 mb-6 max-w-sm mx-auto">
              {ko ? '무료로 시작 · 모든 기기에서 작동 · 1분이면 설정 끝.' : 'Free to start. Works on any device. Takes under a minute to set up.'}
            </p>
            <Link
              to="/?auth=1"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
            >
              {ko ? '무료로 시작하기' : 'Get Started Free'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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
