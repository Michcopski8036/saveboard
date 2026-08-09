import { useEffect } from 'react';
import { Link } from 'react-router';
import { Bookmark, ArrowRight } from 'lucide-react';
import { blogPosts, landingPages, formatDate } from '../../utils/blogUtils';
import { useLanguage } from '../../context/LanguageContext';
import { CARD_STRIP_GRADIENT } from '../../lib/brand';

const BASE_URL = 'https://www.saveboard.app';

export function BlogListPage() {
  const { language } = useLanguage();
  const ko = language === 'ko';
  useEffect(() => {
    document.title = 'Blog — SaveBoard';
    setMeta('description', 'Tips, guides, and updates from the SaveBoard team. Learn how to save and organise links from group chats, WhatsApp, and more.');
    setCanonical(`${BASE_URL}/blog`);
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
            <p className="text-[13px] font-medium text-purple-600 bg-purple-50 inline-block px-3 py-1 rounded-full mb-4">
              {ko ? 'SaveBoard 블로그' : 'SaveBoard Blog'}
            </p>
            <h1 className="text-[44px] sm:text-[54px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-4">
              {ko ? '팁 & 가이드' : 'Tips & Guides'}
            </h1>
            <p className="text-[17px] text-gray-500 max-w-lg mx-auto leading-relaxed">
              {ko ? '링크를 저장·정리·공유하는 실용 팁 — 학부모, 코치, 모임 리더를 위해.' : 'Practical advice on saving, organising, and sharing links — for parents, coaches, and group leaders.'}
            </p>
          </div>

          {blogPosts.length === 0 ? (
            <p className="text-center text-gray-400">{ko ? '아직 게시물이 없어요.' : 'No posts yet.'}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map(post => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="h-0.5" style={{ background: CARD_STRIP_GRADIENT }} />
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-[12px] text-gray-400 mb-3">{formatDate(post.date)}</p>
                    <h2 className="text-[18px] font-bold text-gray-900 leading-snug mb-3 group-hover:text-purple-700 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-[14px] text-gray-500 leading-relaxed flex-1">
                      {post.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-purple-600">
                      {ko ? '글 읽기' : 'Read article'} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {landingPages.length > 0 && (
            <section className="mt-16 pt-12 border-t border-gray-100">
              <h2 className="text-[22px] font-bold text-gray-900 mb-2">
                {ko ? 'SaveBoard 비교하기' : 'Compare SaveBoard'}
              </h2>
              <p className="text-[15px] text-gray-500 mb-6">
                {ko ? '다른 북마크 앱을 쓰고 계신가요? 솔직한 비교를 읽어보세요.' : 'Coming from another bookmark app? Read the honest comparisons.'}
              </p>
              <ul className="flex flex-col gap-3">
                {landingPages.map(page => (
                  <li key={page.route}>
                    {/* Plain <a>: /<route> is prerendered static HTML, not a react-router route,
                        so a client-side Link would fall through to the app shell. */}
                    <a
                      href={`/${page.route}`}
                      className="group inline-flex items-start gap-1.5 text-[15px] font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      {page.title}
                      <ArrowRight className="w-3.5 h-3.5 mt-1 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}

export function Nav() {
  const { language } = useLanguage();
  const ko = language === 'ko';
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 rounded-[8px] bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E]">
            <Bookmark className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-gray-900">
            Save<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/blog" className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
            {ko ? '블로그' : 'Blog'}
          </Link>
          <Link to="/guides" className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
            {ko ? '가이드' : 'Guides'}
          </Link>
          <Link
            to="/?auth=1"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-xl font-semibold text-[13px] hover:opacity-90 transition-opacity"
          >
            {ko ? '시작하기' : 'Get Started'}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function BlogFooter() {
  return (
    <footer className="border-t border-gray-100 py-10 px-5">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 rounded-[8px] bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E]">
            <Bookmark className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[14px] font-semibold text-gray-900">
            Save<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
          </span>
        </Link>
        <p className="text-[12px] text-gray-400">
          © {new Date().getFullYear()} SaveBoard. All rights reserved.
        </p>
      </div>
    </footer>
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
